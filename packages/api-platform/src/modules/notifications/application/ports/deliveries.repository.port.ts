import type { TransactionExecutor } from '@repo/api-core';

export type DeliveryStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface DeliveryRecord {
  id: string;
  notificationId: string;
  deviceTokenId: string;
  channel: string;
  status: DeliveryStatus;
  attempts: number;
  providerMessageId: string | null;
  nextAttemptAt: Date | null;
  sentAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertDeliveryInput {
  notificationId: string;
  deviceTokenId: string;
  channel: string;
}

export interface DeliveriesRepositoryPort {
  upsertBatch(
    values: UpsertDeliveryInput[],
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord[]>;

  claimPending(
    limit: number,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord[]>;

  markSent(
    deliveryId: string,
    providerMessageId: string | null,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;

  markFailed(
    deliveryId: string,
    error: string,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;
}

export const DELIVERIES_REPOSITORY = Symbol('DELIVERIES_REPOSITORY');
