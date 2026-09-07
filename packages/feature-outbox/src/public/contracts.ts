/** Public contracts for @repo/feature-outbox. */
export { OutboxDispatcher } from "../application/outbox-dispatcher.service";
export { OutboxHandlerRegistry } from "../application/outbox-handler.registry";
export { type OutboxHandlerSlot, OutboxModule, type OutboxModuleOptions } from "../outbox.module";
export { OUTBOX_APPENDER, type OutboxAppenderPort } from "./outbox-appender.port";
export {
  OUTBOX_HANDLER_REGISTRY,
  type OutboxHandlerRegistryPort,
  type OutboxMessage,
  type OutboxTopicHandler,
  type OutboxTopicHandlerClass,
  type OutboxTopicHandlerContribution,
} from "./outbox-handler.port";
export { OUTBOX_REPOSITORY, type OutboxRecord } from "./outbox.port";
export type { OutboxRepositoryPort } from "./outbox.port";
