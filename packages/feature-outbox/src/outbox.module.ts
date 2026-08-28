import { Global, Module } from "@nestjs/common";

import { OutboxDispatcher } from "./application/outbox-dispatcher.service";
import { OutboxHandlerRegistry } from "./application/outbox-handler.registry";
import { OutboxRepository } from "./infrastructure/outbox.repository";
import { OUTBOX_APPENDER } from "./public/outbox-appender.port";
import { OUTBOX_HANDLER_REGISTRY } from "./public/outbox-handler.port";
import { OUTBOX_REPOSITORY } from "./public/outbox.port";

/**
 * Generic transactional outbox: producers append events in their own
 * transaction; feature-subscribed OUTBOX_TOPIC_HANDLERS receive them
 * from the dispatcher cron.
 */
@Global()
@Module({
  providers: [
    OutboxRepository,
    OutboxDispatcher,
    OutboxHandlerRegistry,
    {
      provide: OUTBOX_HANDLER_REGISTRY,
      useExisting: OutboxHandlerRegistry,
    },
    {
      provide: OUTBOX_REPOSITORY,
      useExisting: OutboxRepository,
    },
    {
      provide: OUTBOX_APPENDER,
      useExisting: OutboxRepository,
    },
  ],
  exports: [OUTBOX_REPOSITORY, OUTBOX_APPENDER, OUTBOX_HANDLER_REGISTRY],
})
export class OutboxModule {}
