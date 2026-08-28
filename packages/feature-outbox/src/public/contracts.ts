/** Public contracts for @repo/feature-outbox. */
export { OutboxModule } from "../outbox.module";
export { OUTBOX_APPENDER, type OutboxAppenderPort } from "./outbox-appender.port";
export {
  OUTBOX_HANDLER_REGISTRY,
  type OutboxHandlerRegistryPort,
  type OutboxMessage,
  type OutboxTopicHandlerContribution,
} from "./outbox-handler.port";
export { OUTBOX_REPOSITORY, type OutboxRecord } from "./outbox.port";
export type { OutboxRepositoryPort } from "./outbox.port";
