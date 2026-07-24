import type { JsonObject } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

export interface MailDeliveriesRepositoryPort {
  create(
    values: {
      templateKey: string;
      recipient: string;
      subject: string;
      status: 'SENT' | 'FAILED';
      errorMessage?: string | null;
      metadata?: JsonObject | null;
      sentAt?: Date | null;
      sourceJobId?: string | null;
    },
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    templateKey: string;
    recipient: string;
    subject: string;
    status: string;
    errorMessage: string | null;
    metadata: JsonObject | null;
    sentAt: Date | null;
    createdAt: Date;
  } | null>;

  findBySourceJobId(
    sourceJobId: string,
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    status: string;
    recipient: string;
    errorMessage: string | null;
    createdAt: Date;
  } | null>;

  /**
   * Atomically reclaim a previously-attempted delivery (FAILED, or a stale
   * PROCESSING row) back to PENDING so the caller can retry it. Returns the
   * reclaimed row, or null when the row is SENT or does not exist. Used by the
   * idempotent mail state machine to recover a FAILED delivery on retry (H-003).
   */
  reclaimForRetry(
    sourceJobId: string,
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    templateKey: string;
    recipient: string;
    subject: string;
    status: string;
    errorMessage: string | null;
    metadata: JsonObject | null;
    sentAt: Date | null;
    createdAt: Date;
  } | null>;

  updateStatus(
    id: string,
    values: {
      status: 'SENT' | 'FAILED';
      errorMessage?: string | null;
      sentAt?: Date | null;
    },
    executor?: TransactionExecutor,
  ): Promise<void>;

  list(
    params: {
      page: number;
      limit: number;
      templateKey?: string;
      status?: 'SENT' | 'FAILED';
    },
    executor?: TransactionExecutor,
  ): Promise<{
    rows: {
      id: string;
      templateKey: string;
      recipient: string;
      subject: string;
      status: string;
      errorMessage: string | null;
      metadata: JsonObject | null;
      sentAt: Date | null;
      createdAt: Date;
    }[];
    total: number;
  }>;
}

export const MAIL_DELIVERIES_REPOSITORY = Symbol('MAIL_DELIVERIES_REPOSITORY');
