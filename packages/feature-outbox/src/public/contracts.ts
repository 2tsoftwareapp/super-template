/** Public contracts for @repo/feature-outbox. */
export { OutboxDispatcher } from "../application/outbox-dispatcher.service";
export { OutboxHandlerRegistry } from "../application/outbox-handler.registry";
export { type OutboxHandlerSlot, OutboxModule, type OutboxModuleOptions } from "../outbox.module";
export { type OutboxAppenderPort } from "./outbox-appender.port";
export { OUTBOX_APPENDER } from "./outbox-appender.token";
export {
  type OutboxHandlerRegistryPort,
  type OutboxMessage,
  type OutboxTopicHandler,
  type OutboxTopicHandlerClass,
  type OutboxTopicHandlerContribution,
} from "./outbox-handler.port";
export { OUTBOX_HANDLER_REGISTRY } from "./outbox-handler.token";
export { type OutboxRecord, type OutboxRepositoryPort } from "./outbox.port";
export { OUTBOX_REPOSITORY } from "./outbox.token";
