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
 * Adapter a feature-supplied Nest provider exposes to the outbox core. The
 * bridge provider in {@link OutboxModule.register} reads this contract from
 * the injected instance and registers it under its `topic`.
 */
export interface OutboxTopicHandlerContribution {
  readonly topic: string;
  readonly handle: (message: OutboxMessage) => Promise<void>;
}

/**
 * Structural type every outbox handler class must satisfy. A handler is a
 * Nest provider (Injectable) with a static `topic` discriminator and a
 * `handle(message)` instance method. Feature manifests list handler classes
 * in `outboxHandlers`; the composition layer validates uniqueness, then
 * hands the class list to {@link OutboxModule.register}.
 */
export interface OutboxTopicHandler {
  readonly topic: string;
  handle(message: OutboxMessage): Promise<void>;
}

/** Constructor shape required of every outbox handler class. */
export interface OutboxTopicHandlerClass {
  readonly topic: string;
  new (...args: never[]): OutboxTopicHandler;
}

export const OUTBOX_HANDLER_REGISTRY = Symbol("OUTBOX_HANDLER_REGISTRY");

/**
 * Registry port consumed by {@link OutboxDispatcher}. The bridge provider
 * inside {@link OutboxModule.register} populates this on module init; the
 * dispatcher only reads. Nest lifecycle guarantees registration completes
 * before the first cron tick.
 */
export interface OutboxHandlerRegistryPort {
  getAll(): readonly OutboxTopicHandlerContribution[];
}
