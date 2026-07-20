import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { notificationDeviceTokens } from '@repo/api-database';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import type { DeviceTokensRepositoryPort } from '../application/ports/device-tokens.repository.port';

export type NotificationDevicePlatform = 'IOS' | 'ANDROID';

@Injectable()
export class DeviceTokensRepository implements DeviceTokensRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async upsert(
    values: {
      userId: string;
      token: string;
      platform: NotificationDevicePlatform;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    const [deviceToken] = await executor
      .insert(notificationDeviceTokens)
      .values({
        userId: values.userId,
        token: values.token,
        platform: values.platform,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: notificationDeviceTokens.token,
        set: {
          userId: values.userId,
          platform: values.platform,
          lastUsedAt: new Date(),
          disabledAt: null,
          disabledReason: null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return deviceToken ?? null;
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
