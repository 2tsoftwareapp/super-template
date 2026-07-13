import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { notificationDeviceTokens } from '@repo/api-database';
import { and, eq } from 'drizzle-orm';

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
      .where(eq(notificationDeviceTokens.userId, userId));
  }

  async deleteByToken(
    userId: string,
    token: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [deviceToken] = await executor
      .delete(notificationDeviceTokens)
      .where(
        and(
          eq(notificationDeviceTokens.userId, userId),
          eq(notificationDeviceTokens.token, token),
        ),
      )
      .returning();

    return deviceToken ?? null;
  }

  async deleteTokens(
    tokens: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (tokens.length === 0) {
      return;
    }

    for (const token of tokens) {
      await executor
        .delete(notificationDeviceTokens)
        .where(eq(notificationDeviceTokens.token, token));
    }
  }
}
