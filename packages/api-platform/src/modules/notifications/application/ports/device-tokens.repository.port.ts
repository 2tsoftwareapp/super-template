import type { TransactionExecutor } from '@repo/api-core';

export type NotificationDevicePlatform = 'IOS' | 'ANDROID';

export interface DeviceTokenRecord {
  id: string;
  userId: string;
  token: string;
  platform: NotificationDevicePlatform;
  lastUsedAt: Date;
  disabledAt: Date | null;
  disabledReason: string | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface UpsertDeviceTokenInput {
  userId: string;
  token: string;
  platform: NotificationDevicePlatform;
}

/**
 * Result of a registerOrTransfer operation.
 * - created: true when a brand-new row was inserted (same owner or fresh token).
 * - transferred: true when an existing active token was claimed from another user
 *   (old row disabled, pending deliveries invalidated, new row created).
 */
export interface RegisterTokenResult {
  token: DeviceTokenRecord;
  created: boolean;
  transferred: boolean;
}

export interface DeviceTokensRepositoryPort {
  /**
   * Register a device token for a user.
   *
   * Safe ownership semantics (no race):
   *  - Token does not exist                       → insert new row (created=true).
   *  - Token exists, same owner, active           → update lastUsedAt (created=false).
   *  - Token exists, same owner, disabled         → re-enable + update lastUsedAt (created=false).
   *  - Token exists, different owner, any state   → disable old row, invalidate PENDING/PROCESSING
   *    deliveries that reference the old row, insert new row with new ID (transferred=true).
   *
   * All mutations happen inside a single transaction so the processor can never
   * read a half-transferred state.
   *
   * Returns `null` when the per-token advisory lock is unavailable (a delivery
   * to this token is in flight). The caller decides how to surface that — the
   * repository never raises domain/HTTP errors itself.
   */
  registerOrTransfer(values: UpsertDeviceTokenInput, executor?: TransactionExecutor): Promise<RegisterTokenResult | null>;
  listByUserId(userId: string, executor?: TransactionExecutor): Promise<DeviceTokenRecord[]>;
  listByIds(ids: string[], executor?: TransactionExecutor): Promise<DeviceTokenRecord[]>;
  disableByToken(userId: string, token: string, reason: string, executor?: TransactionExecutor): Promise<DeviceTokenRecord | null>;
  disableTokens(tokens: string[], reason: string, executor?: TransactionExecutor): Promise<void>;
  listActiveByToken(token: string, executor?: TransactionExecutor): Promise<DeviceTokenRecord | null>;
}

export const DEVICE_TOKENS_REPOSITORY = Symbol('DEVICE_TOKENS_REPOSITORY');
