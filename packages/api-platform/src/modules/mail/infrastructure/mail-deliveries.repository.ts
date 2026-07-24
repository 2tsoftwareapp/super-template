import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { mailDeliveries } from '@repo/api-database';
import { and, count, desc, eq, sql, lt } from 'drizzle-orm';

import type { DeliveryRecord, MailDeliveriesRepositoryPort } from '../application/ports/mail-deliveries.repository.port';

interface ListDeliveriesParams {
  page: number;
  limit: number;
  templateKey?: string;
  status?: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
}

@Injectable()
export class MailDeliveriesRepository implements MailDeliveriesRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof mailDeliveries.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .insert(mailDeliveries)
      .values(values)
      .onConflictDoNothing()
      .returning();

    return (delivery as DeliveryRecord) ?? null;
  }

  async findBySourceJobId(
    sourceJobId: string,
    recipient?: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters: ReturnType<typeof eq>[] = [eq(mailDeliveries.sourceJobId, sourceJobId)];
    if (recipient) {
      filters.push(eq(mailDeliveries.recipient, recipient));
    }
    const [delivery] = await executor
      .select({
        id: mailDeliveries.id,
        status: mailDeliveries.status,
        recipient: mailDeliveries.recipient,
        errorMessage: mailDeliveries.errorMessage,
        createdAt: mailDeliveries.createdAt,
      })
      .from(mailDeliveries)
      .where(and(...filters))
      .limit(1);

    return delivery ?? null;
  }

  async claimForProcessing(
    deliveryId: string,
    leaseDurationMs = 300_000,
    executor: DatabaseExecutor = this.database,
  ) {
    const LEASE_DURATION_S = Math.ceil(leaseDurationMs / 1000);
    const token = crypto.randomUUID();
    const reclaimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE mail_deliveries
        SET
          status = 'PROCESSING',
          lease_expires_at = now() + (${LEASE_DURATION_S} || ' seconds')::interval,
          claim_token = ${token},
          updated_at = now()
        WHERE id IN (
          SELECT id FROM mail_deliveries
          WHERE id = ${deliveryId}
            AND status = 'PENDING'
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `,
    );

    if (!reclaimed.rows?.[0]) {
      return null;
    }

    const [delivery] = await executor
      .select()
      .from(mailDeliveries)
      .where(eq(mailDeliveries.id, reclaimed.rows[0].id))
      .limit(1);

    return (delivery as DeliveryRecord) ?? null;
  }

  async reclaimForRetry(
    sourceJobId: string,
    recipient: string,
    executor: DatabaseExecutor = this.database,
  ) {
    // Reclaim only a FAILED delivery or a stale PROCESSING row (lease expired)
    // back to PENDING. SENT rows must stay terminal. Matches by the composite
    // unique key (sourceJobId + recipient) to handle multi-recipient source jobs
    // correctly. FOR UPDATE SKIP LOCKED keeps concurrent workers from
    // double-claiming the same row.
    const reclaimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE mail_deliveries
        SET
          status = 'PENDING',
          error_message = NULL,
          sent_at = NULL,
          lease_expires_at = NULL,
          claim_token = NULL,
          updated_at = now()
        WHERE id IN (
          SELECT id FROM mail_deliveries
          WHERE source_job_id = ${sourceJobId}
            AND recipient = ${recipient}
            AND (
              status = 'FAILED'
              OR (status = 'PROCESSING' AND lease_expires_at IS NOT NULL AND lease_expires_at < now())
            )
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `,
    );

    if (!reclaimed.rows?.[0]) {
      return null;
    }

    const [delivery] = await executor
      .select()
      .from(mailDeliveries)
      .where(eq(mailDeliveries.id, reclaimed.rows[0].id))
      .limit(1);

    return (delivery as DeliveryRecord) ?? null;
  }

  async updateStatus(
    id: string,
    claimToken: string,
    values: {
      status: 'SENT' | 'FAILED';
      errorMessage?: string | null;
      sentAt?: Date | null;
    },
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    // Use raw SQL with RETURNING to atomically fence: only update when
    // id + claimToken + status = PROCESSING all match (stale-worker guard).
    const updated = await executor.execute<{ id: string }>(
      sql`
        UPDATE mail_deliveries
        SET
          status = ${values.status}::mail_delivery_status,
          error_message = ${values.errorMessage ?? null},
          sent_at = ${values.sentAt ?? null},
          lease_expires_at = NULL,
          claim_token = NULL,
          updated_at = now()
        WHERE id = ${id}
          AND claim_token = ${claimToken}
          AND status = 'PROCESSING'
        RETURNING id
      `,
    );
    if (!updated.rows?.[0]) {
      const [current] = await executor
        .select({ id: mailDeliveries.id, status: mailDeliveries.status })
        .from(mailDeliveries)
        .where(eq(mailDeliveries.id, id))
        .limit(1);
      if (current) {
        throw new Error(
          `Stale worker update blocked: delivery ${id} is now ${current.status} (claim token mismatch or already finalised)`,
        );
      }
    }
  }

  async list(
    params: ListDeliveriesParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = [];

    if (params.templateKey) {
      filters.push(eq(mailDeliveries.templateKey, params.templateKey));
    }

    if (params.status) {
      filters.push(eq(mailDeliveries.status, params.status as any));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(mailDeliveries)
        .where(whereClause)
        .orderBy(desc(mailDeliveries.createdAt))
        .limit(params.limit)
        .offset(offset),
      executor
        .select({ total: count() })
        .from(mailDeliveries)
        .where(whereClause),
    ]);

    return {
      rows: rows as DeliveryRecord[],
      total: Number(totals[0]?.total ?? 0),
    };
  }
}
