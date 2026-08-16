import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import {
  ADVISORY_LOCK_PORT,
  type AdvisoryLockPort,
} from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';
import { notificationDeliveries, notificationDeviceTokens } from '@repo/api-database';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import type {
  DeviceTokensRepositoryPort,
  RegisterTokenResult,
} from '../application/ports/device-tokens.repository.port';

import { tokenLockId } from '../domain/token-lock';

export type NotificationDevicePlatform = 'IOS' | 'ANDROID';

@Injectable()
export class DeviceTokensRepository implements DeviceTokensRepositoryPort {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(ADVISORY_LOCK_PORT) private readonly advisoryLock: AdvisoryLockPort,
  ) {}

  /**
   * Register or safely transfer a device token.
   *
   * Acquires a per-token advisory lock before opening the write transaction so
   * the delivery processor — which holds the same lock while it sends FCM —
   * cannot be mid-send when ownership changes. The lock is session-level and
   * released after the transaction commits.
   *
   * Flow inside the lock:
   *   Step 1: Look up the active (non-disabled) row for this token.
   *   Step 2a: No active row exists → plain insert.
   *   Step 2b: Active row, same owner → touch lastUsedAt.
   *   Step 2c: Active row, different owner → disable it, invalidate
   *            PENDING/PROCESSING deliveries, insert new row with new UUID.
   *   Historical (disabled) rows are never re-enabled; the partial unique index
   *   guarantees at most one active row per token.
   *
   * The lock + transaction stay in this repository on purpose: they enforce a
   * storage invariant (atomic ownership swap, lock hash shared with the
   * delivery processor), not business orchestration. Returns `null` when the
   * lock is unavailable — the use case decides how to surface it.
   */
  async registerOrTransfer(
    values: {
      userId: string;
      token: string;
      platform: NotificationDevicePlatform;
    },
    executor?: DatabaseExecutor,
  ): Promise<RegisterTokenResult | null> {
    const run = async (tx: DatabaseExecutor): Promise<RegisterTokenResult> => {
      const [existing] = await tx
        .select()
        .from(notificationDeviceTokens)
        .where(
          and(
            eq(notificationDeviceTokens.token, values.token),
            isNull(notificationDeviceTokens.disabledAt),
          ),
        )
        .limit(1);

      const now = new Date();

      if (!existing) {
        const [inserted] = await tx
          .insert(notificationDeviceTokens)
          .values({
            userId: values.userId,
            token: values.token,
            platform: values.platform,
            lastUsedAt: now,
          })
          .returning();

        return { token: inserted!, created: true, transferred: false };
      }

      if (existing.userId === values.userId) {
        const [updated] = await tx
          .update(notificationDeviceTokens)
          .set({
            platform: values.platform,
            lastUsedAt: now,
            disabledAt: null,
            disabledReason: null,
            updatedAt: now,
          })
          .where(eq(notificationDeviceTokens.id, existing.id))
          .returning();

        return { token: updated!, created: false, transferred: false };
      }

      // Different owner — atomic transfer
      await tx
        .update(notificationDeviceTokens)
        .set({
          disabledAt: now,
          disabledReason: 'Token claimed by new account',
          updatedAt: now,
        })
        .where(eq(notificationDeviceTokens.id, existing.id));

      await tx
        .update(notificationDeliveries)
        .set({
          status: 'FAILED',
          lastError: 'Device token ownership transferred to another account',
          updatedAt: now,
        })
        .where(
          and(
            eq(notificationDeliveries.deviceTokenId, existing.id),
            inArray(notificationDeliveries.status, ['PENDING', 'PROCESSING']),
          ),
        );

      const [inserted] = await tx
        .insert(notificationDeviceTokens)
        .values({
          userId: values.userId,
          token: values.token,
          platform: values.platform,
          lastUsedAt: now,
        })
        .returning();

      return { token: inserted!, created: true, transferred: true };
    };

    // When called inside an existing executor skip advisory locking — the
    // caller is responsible for serialization in that context.
    if (executor) {
      return run(executor);
    }

    // Acquire the per-token lock so that a concurrent delivery processor
    // holding the same lock cannot be between its owner-check and FCM send
    // while we swap ownership. `null` = lock unavailable (delivery in flight).
    return this.advisoryLock.withAdvisoryLock(
      tokenLockId(values.token),
      () => runInTransaction(this.database, run),
    );
  }

  async listByUserId(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select()
      .from(notificationDeviceTokens)
      .where(
        and(
          eq(notificationDeviceTokens.userId, userId),
          isNull(notificationDeviceTokens.disabledAt),
        ),
      );
  }

  async listByIds(
    ids: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (ids.length === 0) {
      return [];
    }

    return executor
      .select()
      .from(notificationDeviceTokens)
      .where(
        and(
          inArray(notificationDeviceTokens.id, ids),
          isNull(notificationDeviceTokens.disabledAt),
        ),
      );
  }

  async listActiveByToken(
    token: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [deviceToken] = await executor
      .select()
      .from(notificationDeviceTokens)
      .where(
        and(
          eq(notificationDeviceTokens.token, token),
          isNull(notificationDeviceTokens.disabledAt),
        ),
      )
      .limit(1);

    return deviceToken ?? null;
  }

  async disableByToken(
    userId: string,
    token: string,
    reason: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [deviceToken] = await executor
      .update(notificationDeviceTokens)
      .set({
        disabledAt: new Date(),
        disabledReason: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notificationDeviceTokens.userId, userId),
          eq(notificationDeviceTokens.token, token),
        ),
      )
      .returning();

    return deviceToken ?? null;
  }

  async disableTokens(
    tokens: string[],
    reason: string,
    executor: DatabaseExecutor = this.database,
  ) {
    if (tokens.length === 0) {
      return;
    }

    await executor
      .update(notificationDeviceTokens)
      .set({
        disabledAt: new Date(),
        disabledReason: reason,
        updatedAt: new Date(),
      })
      .where(inArray(notificationDeviceTokens.token, tokens));
  }
}
