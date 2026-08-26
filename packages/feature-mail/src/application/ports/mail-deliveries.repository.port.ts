import type { JsonObject } from "@repo/api-runtime";
import type { TransactionExecutor } from "@repo/api-runtime";

export type MailDeliveryStatus = "PENDING" | "PROCESSING" | "PROVIDER_ACCEPTED" | "SENT" | "FAILED";

export interface DeliveryRecord {
  id: string;
  templateKey: string;
  recipient: string;
  subject: string;
  status: MailDeliveryStatus;
  errorMessage: string | null;
  metadata: JsonObject | null;
  sentAt: Date | null;
  leaseExpiresAt: Date | null;
  claimToken: string | null;
  providerMessageId: string | null;
  createdAt: Date;
}

export interface MailDeliveriesRepositoryPort {
  create(
    values: {
      templateKey: string;
      recipient: string;
      subject: string;
      status: MailDeliveryStatus;
      errorMessage?: string | null;
      metadata?: JsonObject | null;
      sentAt?: Date | null;
      sourceJobId?: string | null;
    },
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;

  findBySourceJobId(
    sourceJobId: string,
    recipient?: string,
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    status: MailDeliveryStatus;
    recipient: string;
    errorMessage: string | null;
    createdAt: Date;
  } | null>;

  /**
   * Atomically claim a PENDING delivery for processing, setting status to
   * PROCESSING with a lease. Returns the claimed row, or null if not available.
   * Uses FOR UPDATE SKIP LOCKED to prevent concurrent claims.
   */
  claimForProcessing(
    deliveryId: string,
    leaseDurationMs?: number,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;

  /**
   * Atomically reclaim a previously-failed delivery (FAILED, or a stale
   * PROCESSING row whose lease has expired) back to PENDING for retry.
   * Filters by recipient to match the composite unique index.
   * Returns the reclaimed row, or null when the row is SENT or does not exist.
   */
  reclaimForRetry(
    sourceJobId: string,
    recipient: string,
    executor?: TransactionExecutor,
  ): Promise<DeliveryRecord | null>;

  /**
   * Update delivery status with fencing: requires id + claimToken + status = PROCESSING
   * to prevent a stale worker from writing after lease expiry and reclaim.
   */
  updateStatus(
    id: string,
    claimToken: string,
    values: {
      status: "SENT" | "FAILED";
      errorMessage?: string | null;
      sentAt?: Date | null;
      providerMessageId?: string | null;
    },
    executor?: TransactionExecutor,
  ): Promise<void>;

  /**
   * Unfenced escape-hatch status update used after SMTP accepted the email
   * but the fenced updateStatus(SENT) failed. Uses raw SQL to bypass Drizzle's
   * type safety and the claim-token fence. Only sets PROVIDER_ACCEPTED.
   */
  markProviderAccepted(
    deliveryId: string,
    providerMessageId?: string,
    executor?: TransactionExecutor,
  ): Promise<void>;

  list(
    params: {
      page: number;
      limit: number;
      templateKey?: string;
      status?: MailDeliveryStatus;
    },
    executor?: TransactionExecutor,
  ): Promise<{
    rows: DeliveryRecord[];
    total: number;
  }>;
}

export const MAIL_DELIVERIES_REPOSITORY = Symbol("MAIL_DELIVERIES_REPOSITORY");
