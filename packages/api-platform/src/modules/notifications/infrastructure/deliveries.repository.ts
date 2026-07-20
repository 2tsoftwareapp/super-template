import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, notificationDeliveries } from '@repo/api-database';
import { and, eq, sql } from 'drizzle-orm';

import type {
  DeliveriesRepositoryPort,
  UpsertDeliveryInput,
} from '../application/ports/deliveries.repository.port';

@Injectable()
export class DeliveriesRepository implements DeliveriesRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async upsertBatch(
    values: UpsertDeliveryInput[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (values.length === 0) {
      return [];
    }

    return executor
      .insert(notificationDeliveries)
      .values(values)
      .onConflictDoNothing({
        target: [
          notificationDeliveries.notificationId,
          notificationDeliveries.deviceTokenId,
          notificationDeliveries.channel,
        ],
      })
      .returning();
  }

  async claimPending(limit: number, executor: DatabaseExecutor = this.database) {
    const claimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE notification_deliveries
        SET status = 'PROCESSING', attempts = attempts + 1, updated_at = now()
        WHERE id IN (
          SELECT id FROM notification_deliveries
          WHERE status = 'PENDING'
            AND (next_attempt_at IS NULL OR next_attempt_at <= now())
          ORDER BY next_attempt_at ASC NULLS FIRST
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `,
    );

    if (!claimed.rows || claimed.rows.length === 0) {
      return [];
    }

    const ids = claimed.rows.map((r) => r.id);
    return executor
      .select()
      .from(notificationDeliveries)
      .where(sql`${notificationDeliveries.id} = ANY(${ids})`);
  }

  async markSent(
    deliveryId: string,
    providerMessageId: string | null,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .update(notificationDeliveries)
      .set({
        status: 'SENT',
        providerMessageId,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, deliveryId))
      .returning();

    return delivery ?? null;
  }

  async markFailed(
    deliveryId: string,
    error: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .update(notificationDeliveries)
      .set({
        status: 'FAILED',
        lastError: error,
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, deliveryId))
      .returning();

    return delivery ?? null;
  }

  async markRetryable(
    deliveryId: string,
    nextAttemptAt: Date,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .update(notificationDeliveries)
      .set({
        status: 'PENDING',
        nextAttemptAt,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, deliveryId))
      .returning();

    return delivery ?? null;
  }

  async recoverStaleProcessing(
    timeoutMinutes: number,
    executor: DatabaseExecutor = this.database,
  ) {
    const recovered = await executor.execute<{ id: string }>(
      sql`
        UPDATE notification_deliveries
        SET status = 'PENDING',
            next_attempt_at = now(),
            last_error = 'Recovered from stale PROCESSING',
            updated_at = now()
        WHERE id IN (
          SELECT id FROM notification_deliveries
          WHERE status = 'PROCESSING'
            AND updated_at < now() - make_interval(mins => ${timeoutMinutes})
          LIMIT 100
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `,
    );

    if (!recovered.rows || recovered.rows.length === 0) {
      return [];
    }

    const ids = recovered.rows.map((r) => r.id);
    return executor
      .select()
      .from(notificationDeliveries)
      .where(sql`${notificationDeliveries.id} = ANY(${ids})`);
  }
}
