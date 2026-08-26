import type { TransactionExecutor } from "@repo/api-runtime";

export type OutboxTopic = "auth.send-verification-email";

export interface OutboxMessagePayload {
  email: string;
  token: string;
  displayName?: string;
}

export interface OutboxRecord {
  id: string;
  topic: OutboxTopic;
  payload: OutboxMessagePayload;
  status: string;
  attempts: number;
  maxAttempts: number;
}

export interface OutboxRepositoryPort {
  create(
    values: {
      topic: OutboxTopic;
      payload: OutboxMessagePayload;
    },
    executor?: TransactionExecutor,
  ): Promise<void>;
  claimPending(limit: number): Promise<OutboxRecord[]>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
  recoverStaleProcessing(): Promise<void>;
}

export const OUTBOX_REPOSITORY = Symbol("OUTBOX_REPOSITORY");
