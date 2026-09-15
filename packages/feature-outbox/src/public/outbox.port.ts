import type { JsonObject, TransactionExecutor } from "@repo/api-kernel";

export interface OutboxRecord {
  id: string;
  /** Tenant that published the event; `null` for platform-scope events. */
  organizationId: string | null;
  topic: string;
  payload: JsonObject;
  status: string;
  attempts: number;
  maxAttempts: number;
}

export interface OutboxRepositoryPort {
  append(topic: string, payload: JsonObject, executor?: TransactionExecutor): Promise<void>;
  claimPending(limit: number): Promise<OutboxRecord[]>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
  recoverStaleProcessing(): Promise<void>;
}

export { OUTBOX_APPENDER, type OutboxAppenderPort } from "./outbox-appender.port";

export { OUTBOX_REPOSITORY } from "./outbox.token";
