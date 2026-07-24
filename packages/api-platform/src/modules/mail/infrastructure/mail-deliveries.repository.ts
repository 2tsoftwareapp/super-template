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

    return (delivery as DeliveryRecord) ?? null;
  }

  async findBySourceJobId(
    sourceJobId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .select({
        id: mailDeliveries.id,
        status: mailDeliveries.status,
        recipient: mailDeliveries.recipient,
        errorMessage: mailDeliveries.errorMessage,
        createdAt: mailDeliveries.createdAt,
      })
      .from(mailDeliveries)
      .where(eq(mailDeliveries.sourceJobId, sourceJobId))
      .limit(1);

    return delivery ?? null;
  }

  async claimForProcessing(
    deliveryId: string,
    leaseDurationMs = 300_000,
    executor: DatabaseExecutor = this.database,
  ) {
    const LEASE_DURATION_S = Math.ceil(leaseDurationMs / 1000);
    const reclaimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE mail_deliveries
        SET
          status = 'PROCESSING',
          lease_expires_at = now() + (${LEASE_DURATION_S} || ' seconds')::interval,
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
      // Row may have been claimed by another worker; look up current status.
      const [existing] = await executor
        .select()
        .from(mailDeliveries)
        .where(eq(mailDeliveries.id, deliveryId))
        .limit(1);
      return (existing as DeliveryRecord) ?? null;
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
    executor: DatabaseExecutor = this.database,
  ) {
    // Reclaim only a FAILED delivery or a stale PROCESSING row (lease expired)
    // back to PENDING. SENT rows must stay terminal. FOR UPDATE SKIP LOCKED
    // keeps concurrent workers from double-claiming the same row.
    const reclaimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE mail_deliveries
        SET
          status = 'PENDING',
          error_message = NULL,
          sent_at = NULL,
          lease_expires_at = NULL,
          updated_at = now()
        WHERE id IN (
          SELECT id FROM mail_deliveries
          WHERE source_job_id = ${sourceJobId}
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
        leaseExpiresAt: null,
        updatedAt: new Date(),
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
