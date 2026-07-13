import type { DatabaseExecutor } from '@repo/api-database';

export type NotificationDevicePlatform = 'IOS' | 'ANDROID';

export interface DeviceTokenRecord {
  id: string;
  userId: string;
  token: string;
  platform: NotificationDevicePlatform;
  lastUsedAt: Date;
  updatedAt: Date;
  createdAt: Date;
}

export interface UpsertDeviceTokenInput {
  userId: string;
  token: string;
  platform: NotificationDevicePlatform;
}

export interface DeviceTokensRepositoryPort {
  upsert(values: UpsertDeviceTokenInput, executor?: DatabaseExecutor): Promise<DeviceTokenRecord | null>;
  listByUserId(userId: string, executor?: DatabaseExecutor): Promise<DeviceTokenRecord[]>;
  deleteByToken(userId: string, token: string, executor?: DatabaseExecutor): Promise<DeviceTokenRecord | null>;
  deleteTokens(tokens: string[], executor?: DatabaseExecutor): Promise<void>;
}

export const DEVICE_TOKENS_REPOSITORY = Symbol('DEVICE_TOKENS_REPOSITORY');
