import type {
  DatabaseClient,
  DatabaseExecutor,
  DatabaseTransaction,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, runInTransaction } from '@repo/api-database';
import { notificationDeliveries, notificationDeviceTokens } from '@repo/api-database';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import type {
  DeviceTokenRecord,
  DeviceTokensRepositoryPort,
  RegisterTokenResult,
} from '../application/ports/device-tokens.repository.port';

export type NotificationDevicePlatform = 'IOS' | 'ANDROID';

@Injectable()
export class DeviceTokensRepository implements DeviceTokensRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  /**
   * Register or safely transfer a device token.
   *
   * Flow:
   *   Step 1: Look up any existing row for this token (active or disabled).
   *   Step 2a: No existing row → plain insert.
   *   Step 2b: Same owner, active → touch lastUsedAt only.
   *   Step 2c: Same owner, disabled → re-enable + touch lastUsedAt.
   *   Step 2d: Different owner → disable old row, invalidate its PENDING/PROCESSING
   *            deliveries to prevent cross-account push, insert brand-new row with
   *            a new UUID so the processor never races on the old row's ID.
   *
   * All mutations run inside a single transaction (serialized on the token string).
   */
  async registerOrTransfer(
    values: {
      userId: string;
      token: string;
      platform: NotificationDevicePlatform;
    },
    executor?: DatabaseExecutor,
  ): Promise<RegisterTokenResult> {
    const run = async (tx: DatabaseExecutor): Promise<RegisterTokenResult> => {
      // Step 1: find any existing row for this token (active or disabled)
      const [existing] = await tx
        .select()
        .from(notificationDeviceTokens)
        .where(eq(notificationDeviceTokens.token, values.token))
        .limit(1);

      const now = new Date();

      if (!existing) {
        // Step 2a: fresh token — plain insert
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
        // Step 2b/c: same owner — re-enable if disabled, always touch lastUsedAt
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

      // Step 2d: different owner — atomic transfer
      // Disable the old row so the processor's owner check sees it gone immediately
      await tx
        .update(notificationDeviceTokens)
        .set({
          disabledAt: now,
          disabledReason: 'Token claimed by new account',
          updatedAt: now,
        })
        .where(eq(notificationDeviceTokens.id, existing.id));

      // Invalidate any PENDING or PROCESSING deliveries that reference the old token
      // row. This prevents the processor from sending a notification belonging to
      // the previous owner after the ownership check passes at claim time but before
      // sendToToken() is called.
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

      // Insert a brand-new row so the new owner gets a distinct UUID — the
      // processor's tokenMap is keyed by ID, so stale claims from the old ID can
      // never reach the new user's token string.
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

    // If we already have a transaction executor, run inside it; otherwise open one
    // so all three mutations (disable, invalidate deliveries, insert) are atomic.
    if (executor) {
      return run(executor as DatabaseTransaction);
    }

    return runInTransaction(this.database, run);
  }

  /** @deprecated Use registerOrTransfer. */
  async upsert(
    values: {
      userId: string;
      token: string;
      platform: NotificationDevicePlatform;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    const { token } = await this.registerOrTransfer(values, executor);
    return token;
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
