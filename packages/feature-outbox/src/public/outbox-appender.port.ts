import type { JsonObject } from "@repo/api-kernel";
import type { TransactionExecutor } from "@repo/api-kernel";

/**
 * Transactional event publisher. Producers append a topic + JSON payload in
 * the SAME transaction as their state change; the outbox dispatcher delivers
 * to registered handlers exactly-once-per-attempt afterwards.
 */
export interface OutboxAppenderPort {
  append(
    topic: string,
    payload: JsonObject,
    executor?: TransactionExecutor,
  ): Promise<void>;
}

export const OUTBOX_APPENDER = Symbol("OUTBOX_APPENDER");
