import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { mailDeliveries } from '@repo/api-database';
import { and, count, desc, eq, sql } from 'drizzle-orm';

import type { MailDeliveriesRepositoryPort } from '../application/ports/mail-deliveries.repository.port';

interface ListDeliveriesParams {
  page: number;
  limit: number;
  templateKey?: string;
  status?: 'SENT' | 'FAILED';
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

    return delivery ?? null;
  }

  async findBySourceJobId(
    sourceJobId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .select({ id: mailDeliveries.id, status: mailDeliveries.status, recipient: mailDeliveries.recipient, errorMessage: mailDeliveries.errorMessage, createdAt: mailDeliveries.createdAt })
      .from(mailDeliveries)
      .where(eq(mailDeliveries.sourceJobId, sourceJobId))
      .limit(1);

    return delivery ?? null;
  }

  async reclaimForRetry(
    sourceJobId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    // Reclaim only a FAILED delivery (or a stale PROCESSING one) back to PENDING.
    // SENT rows must stay terminal — never reset them. FOR UPDATE SKIP LOCKED
    // keeps concurrent workers from double-claiming the same row.
    const reclaimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE mail_deliveries
        SET status = 'PENDING', error_message = NULL, sent_at = NULL, updated_at = now()
        WHERE id IN (
          SELECT id FROM mail_deliveries
          WHERE source_job_id = ${sourceJobId}
            AND status IN ('FAILED', 'PROCESSING')
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `,
    );

    if (!reclaimed.rows || reclaimed.rows.length === 0) {
      return null;
    }

    const first = reclaimed.rows?.[0];
    if (!first) {
      return null;
    }

    const reclaimedId = first.id;
    const [delivery] = await executor
      .select()
      .from(mailDeliveries)
      .where(eq(mailDeliveries.id, reclaimedId))
      .limit(1);

    return delivery ?? null;
  }

  async updateStatus(
    id: string,
    values: {
      status: 'SENT' | 'FAILED';
      errorMessage?: string | null;
      sentAt?: Date | null;
    },
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await executor
      .update(mailDeliveries)
      .set({
        status: values.status,
        ...(values.errorMessage !== undefined ? { errorMessage: values.errorMessage } : {}),
        ...(values.sentAt !== undefined ? { sentAt: values.sentAt } : {}),
      })
      .where(eq(mailDeliveries.id, id));
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
      filters.push(eq(mailDeliveries.status, params.status));
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
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }
}
