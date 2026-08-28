import { Injectable } from "@nestjs/common";

import type {
  OutboxHandlerRegistryPort,
  OutboxTopicHandlerContribution,
} from "../public/outbox-handler.port";

/**
 * Read-only registry consumed by {@link OutboxDispatcher}. Populated exactly
 * once during the onModuleInit hook of the bridge provider installed by
 * {@link OutboxModule.register}. No public mutator: registration is private
 * to the outbox feature, driven by the composed handler class list.
 */
@Injectable()
export class OutboxHandlerRegistry implements OutboxHandlerRegistryPort {
  private readonly contributions: readonly OutboxTopicHandlerContribution[];

  constructor(contributions: readonly OutboxTopicHandlerContribution[]) {
    this.contributions = contributions;
  }

  getAll(): readonly OutboxTopicHandlerContribution[] {
    return this.contributions;
  }
}
