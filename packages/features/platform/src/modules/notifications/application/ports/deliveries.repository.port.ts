import type { TransactionExecutor } from "@repo/api-core";

export type DeliveryStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

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

  claimPending(limit: number, executor?: TransactionExecutor): Promise<DeliveryRecord[]>;

  markSent(
    deliveryId: string,
    providerMessageId: string | null,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;

  /**
   * Conditionally mark a delivery as SENT only when it is still in PROCESSING
   * state. Returns null if the row was already invalidated (FAILED/CANCELLED)
   * by a concurrent token transfer — the caller must treat null as "do not
   * retry; delivery was superseded".
   */
  markSentIfProcessing(
    deliveryId: string,
    providerMessageId: string | null,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;

  markFailed(
    deliveryId: string,
    error: string,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;

  markRetryable(
    deliveryId: string,
    nextAttemptAt: Date,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;

  recoverStaleProcessing(
    timeoutMinutes: number,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord[]>;
}

export const DELIVERIES_REPOSITORY = Symbol("DELIVERIES_REPOSITORY");
