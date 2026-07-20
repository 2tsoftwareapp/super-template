import type { TransactionExecutor } from '@repo/api-core';

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
  upsert(values: UpsertDeviceTokenInput, executor?: TransactionExecutor): Promise<DeviceTokenRecord | null>;
  listByUserId(userId: string, executor?: TransactionExecutor): Promise<DeviceTokenRecord[]>;
  listByIds(ids: string[], executor?: TransactionExecutor): Promise<DeviceTokenRecord[]>;
  disableByToken(userId: string, token: string, reason: string, executor?: TransactionExecutor): Promise<DeviceTokenRecord | null>;
  disableTokens(tokens: string[], reason: string, executor?: TransactionExecutor): Promise<void>;
  listActiveByToken(token: string, executor?: TransactionExecutor): Promise<DeviceTokenRecord | null>;
}

export const DEVICE_TOKENS_REPOSITORY = Symbol('DEVICE_TOKENS_REPOSITORY');
