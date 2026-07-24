/**
 * Feature 07 Round 6 — PostgreSQL integration tests for the two runtime-only
 * paths that static typecheck could not prove:
 *
 *   H-002  savepoint identifier safety + per-edge isolation
 *          (UUID job ids contain hyphens → must be quoted)
 *   H-003  mail delivery FAILED → reclaim → PENDING state machine
 *
 * These run against a real Postgres (container `super-template-postgres:5432`).
 * A throwaway database `fullstack_starter_test` is created/dropped per run, so
 * the development database is never touched.
 */
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { TransactionExecutor } from '@repo/api-core';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DrizzleTransactionService } from '@repo/api-database/drizzle-transaction.service';
import { MailDeliveriesRepository } from '@repo/api-platform/modules/mail/infrastructure/mail-deliveries.repository';

const TEST_DB = 'fullstack_starter_test';
const ADMIN_URL = 'postgresql://postgres:postgres@localhost:5432/postgres';
const TEST_URL = `postgresql://postgres:postgres@localhost:5432/${TEST_DB}`;

const adminPool = new Pool({ connectionString: ADMIN_URL });

async function recreateTestDatabase(): Promise<void> {
  await adminPool.query(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`);
  await adminPool.query(`CREATE DATABASE "${TEST_DB}"`);
}

/**
 * Build only the minimal schema the two targeted tests need (mail_deliveries +
 * a status enum), instead of running the full migration suite. This keeps the
 * integration test focused on the H-002 / H-003 runtime paths without coupling
 * it to unrelated migration ordering.
 */
async function createMinimalSchema(pool: Pool): Promise<void> {
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE mail_delivery_status AS ENUM ('SENT', 'FAILED', 'PENDING', 'PROCESSING');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mail_deliveries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      template_key text NOT NULL,
      recipient text NOT NULL,
      subject text NOT NULL,
      status mail_delivery_status NOT NULL,
      error_message text,
      metadata jsonb,
      source_job_id uuid,
      sent_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS mail_deliveries_job_recipient_uniq
      ON mail_deliveries (source_job_id, recipient);
  `);
}

describe('Feature 07 Round 6 — Postgres integration', () => {
  let db: ReturnType<typeof drizzle>;
  let transaction: DrizzleTransactionService;
  let mailRepo: MailDeliveriesRepository;

  beforeAll(async () => {
    await recreateTestDatabase();
    const pool = new Pool({ connectionString: TEST_URL });
    try {
      await createMinimalSchema(pool);
    } finally {
      await pool.end();
    }
    const appPool = new Pool({ connectionString: TEST_URL });
    db = drizzle(appPool);
    transaction = new DrizzleTransactionService();
    mailRepo = new MailDeliveriesRepository(db as never);
  }, 120_000);

  afterAll(async () => {
    await adminPool.query(`DROP DATABASE IF EXISTS "${TEST_DB}" WITH (FORCE)`);
    await adminPool.end();
  });

  describe('H-002 — savepoint identifier safety + isolation', () => {
    it('accepts a UUID-named savepoint without a syntax error', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      await (db as any).transaction(async (executor: TransactionExecutor) => {
        await transaction.withSavepoint(executor, `propagate_${uuid}`, async () => {
          await executor.execute(sql`SELECT 1`);
        });
      });
      // No throw ⇒ the UUID-with-hyphens identifier was correctly quoted.
      expect(true).toBe(true);
    });

    it('isolates a failing edge: inner rollback does not abort the outer transaction', async () => {
      const uuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      await (db as any).transaction(async (executor: TransactionExecutor) => {
        await executor.execute(
          sql`CREATE TABLE IF NOT EXISTS f07_iso (id text primary key, n int)`,
        );
        await executor.execute(
          sql`INSERT INTO f07_iso (id, n) VALUES (${'outer'}, ${1})`,
        );

        // Edge 1 fails inside its savepoint.
        await transaction
          .withSavepoint(executor, `propagate_${uuid}`, async () => {
            await executor.execute(
              sql`INSERT INTO f07_iso (id, n) VALUES (${'inner'}, ${'not-a-number'})`,
            );
          })
          .catch(() => {
            // Per-edge isolation: swallow like PropagationService does.
          });

        // Outer work must still commit — proving the failed edge was isolated.
        await executor.execute(
          sql`INSERT INTO f07_iso (id, n) VALUES (${'outer2'}, ${2})`,
        );
      });

      // Query outside the transaction to confirm both outer rows persisted.
      const pool = new Pool({ connectionString: TEST_URL });
      try {
        const res = await pool.query<{ id: string }>(
          'SELECT id FROM f07_iso ORDER BY id',
        );
        const ids = res.rows.map((r) => r.id);
        expect(ids).toContain('outer');
        expect(ids).toContain('outer2');
        expect(ids).not.toContain('inner');
      } finally {
        await pool.end();
      }
    });
  });

  describe('H-003 — mail delivery FAILED → reclaim → PENDING', () => {
    it('reclaims a FAILED delivery back to PENDING for retry', async () => {
      const sourceJobId = '11111111-1111-1111-1111-111111111111';
      const recipient = 'retry@example.local';

      await (db as any).transaction(async (executor: TransactionExecutor) => {
        await executor.execute(sql`
          INSERT INTO mail_deliveries (template_key, recipient, subject, status, source_job_id)
          VALUES (${'welcome'}, ${recipient}, ${'Welcome'}, ${'FAILED'}, ${sourceJobId})
        `);
      });

      const reclaimed = await (db as any).transaction(async (executor: TransactionExecutor) => {
        return mailRepo.reclaimForRetry(sourceJobId, executor as never);
      });

      expect(reclaimed).not.toBeNull();
      expect(reclaimed?.status).toBe('PENDING');
      expect(reclaimed?.recipient).toBe(recipient);

      // Idempotency: a SENT delivery must NOT be reclaimed.
      const sentJobId = '22222222-2222-2222-2222-222222222222';
      await (db as any).transaction(async (executor: TransactionExecutor) => {
        await executor.execute(sql`
          INSERT INTO mail_deliveries (template_key, recipient, subject, status, source_job_id)
          VALUES (${'welcome'}, ${'sent@example.local'}, ${'Welcome'}, ${'SENT'}, ${sentJobId})
        `);
      });
      const sentReclaim = await (db as any).transaction(async (executor: TransactionExecutor) => {
        return mailRepo.reclaimForRetry(sentJobId, executor as never);
      });
      expect(sentReclaim).toBeNull();
    });
  });
});
