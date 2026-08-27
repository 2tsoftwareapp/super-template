import { Global, Module, type Provider } from "@nestjs/common";

import { OutboxDispatcher } from "./application/outbox-dispatcher.service";
import { OutboxRepository } from "./infrastructure/outbox.repository";
import { OUTBOX_APPENDER } from "./public/outbox-appender.port";
import { OUTBOX_REPOSITORY } from "./public/outbox.port";
import { OUTBOX_TOPIC_HANDLER } from "./public/outbox-handler.port";

/**
 * Generic transactional outbox: producers append events in their own
 * transaction; feature-subscribed OUTBOX_TOPIC_HANDLER providers receive them
 * from the dispatcher cron.
 */
@Global()
@Module({
  providers: [
    OutboxRepository,
    OutboxDispatcher,
    {
      provide: OUTBOX_REPOSITORY,
      useExisting: OutboxRepository,
    },
    {
      provide: OUTBOX_APPENDER,
      useExisting: OutboxRepository,
    },
    {
      provide: OUTBOX_TOPIC_HANDLER,
      useFactory: () => [],
      multi: true,
    } as Provider,
  ],
  exports: [OUTBOX_REPOSITORY, OUTBOX_APPENDER],
})
export class OutboxModule {}
