import type { DatabaseClient, DatabaseExecutor } from "@repo/api-database";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, notificationDeliveries } from "@repo/api-database";
import { and, eq, inArray, sql } from "drizzle-orm";

import type {
  DeliveriesRepositoryPort,
  UpsertDeliveryInput,
} from "../application/ports/deliveries.repository.port";

import { MAX_DELIVERY_RETRY_ATTEMPTS } from "../domain/delivery-policy";

@Injectable()
export class DeliveriesRepository implements DeliveriesRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async upsertBatch(values: UpsertDeliveryInput[], executor: DatabaseExecutor = this.database) {
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
      .where(inArray(notificationDeliveries.id, ids));
  }

  async markSent(
    deliveryId: string,
    providerMessageId: string | null,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .update(notificationDeliveries)
      .set({
        status: "SENT",
        providerMessageId,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, deliveryId))
      .returning();

    return delivery ?? null;
  }

  /**
   * Mark SENT only when the delivery is still PROCESSING.
   * Returns null when the row was already set to FAILED/CANCELLED by a
   * concurrent token-ownership transfer — caller treats null as "superseded,
   * no further action needed".
   */
  async markSentIfProcessing(
    deliveryId: string,
    providerMessageId: string | null,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .update(notificationDeliveries)
      .set({
        status: "SENT",
        providerMessageId,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notificationDeliveries.id, deliveryId),
          eq(notificationDeliveries.status, "PROCESSING"),
        ),
      )
      .returning();

    return delivery ?? null;
  }

  async markFailed(deliveryId: string, error: string, executor: DatabaseExecutor = this.database) {
    const [delivery] = await executor
      .update(notificationDeliveries)
      .set({
        status: "FAILED",
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
        status: "PENDING",
        nextAttemptAt,
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, deliveryId))
      .returning();

    return delivery ?? null;
  }

  /**
   * Recover PROCESSING deliveries stuck beyond `timeoutMinutes`.
   *
   * - attempts < MAX_RETRY_ATTEMPTS → reset to PENDING for retry.
   * - attempts >= MAX_RETRY_ATTEMPTS → mark FAILED so they don't loop forever.
   *
   * Uses FOR UPDATE SKIP LOCKED so concurrent workers don't double-recover.
   */
  async recoverStaleProcessing(timeoutMinutes: number, executor: DatabaseExecutor = this.database) {
    const staleIds = await executor.execute<{ id: string }>(
      sql`
        SELECT id FROM notification_deliveries
        WHERE status = 'PROCESSING'
          AND updated_at < now() - make_interval(mins => ${timeoutMinutes})
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      `,
    );

    if (!staleIds.rows || staleIds.rows.length === 0) {
      return [];
    }

    const ids = staleIds.rows.map((r) => r.id);

    // Rows under the attempt cap → retry; at/above cap → fail permanently.
    await Promise.all([
      executor
        .update(notificationDeliveries)
        .set({
          status: "PENDING",
          nextAttemptAt: new Date(),
          lastError: "Recovered from stale PROCESSING",
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(notificationDeliveries.id, ids),
            sql`${notificationDeliveries.attempts} < ${MAX_DELIVERY_RETRY_ATTEMPTS}`,
          ),
        ),
      executor
        .update(notificationDeliveries)
        .set({
          status: "FAILED",
          lastError: "Max retry attempts exceeded during stale recovery",
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(notificationDeliveries.id, ids),
            sql`${notificationDeliveries.attempts} >= ${MAX_DELIVERY_RETRY_ATTEMPTS}`,
          ),
        ),
    ]);

    // Return all affected rows (both buckets) for logging
    return executor
      .select()
      .from(notificationDeliveries)
      .where(inArray(notificationDeliveries.id, ids));
  }
}
