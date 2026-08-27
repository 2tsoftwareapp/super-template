import type { JsonObject } from "@repo/api-kernel";

/** A claimed outbox message handed to its topic handler. */
export interface OutboxMessage {
  readonly id: string;
  readonly topic: string;
  readonly payload: JsonObject;
  readonly attempts: number;
  readonly maxAttempts: number;
}

/**
 * Feature-subscribed outbox handler. Each subscribing feature registers
 * handlers for the topics it owns (e.g. auth handles user.lifecycle.*);
 * the outbox core never imports an owning feature.
 */
export interface OutboxTopicHandlerContribution {
  readonly topic: string;
  readonly handle: (message: OutboxMessage) => Promise<void>;
}

export const OUTBOX_TOPIC_HANDLER = Symbol("OUTBOX_TOPIC_HANDLER");
