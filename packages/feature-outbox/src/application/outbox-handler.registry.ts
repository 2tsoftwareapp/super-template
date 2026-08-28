import { Injectable } from "@nestjs/common";

import type {
  OutboxHandlerRegistryPort,
  OutboxTopicHandlerContribution,
} from "../public/outbox-handler.port";

@Injectable()
export class OutboxHandlerRegistry implements OutboxHandlerRegistryPort {
  private readonly handlers = new Map<string, OutboxTopicHandlerContribution>();

  register(contribution: OutboxTopicHandlerContribution): void {
    if (this.handlers.has(contribution.topic)) {
      throw new Error(`Duplicate outbox handler registration for topic "${contribution.topic}".`);
    }
    this.handlers.set(contribution.topic, contribution);
  }

  getAll(): readonly OutboxTopicHandlerContribution[] {
    return [...this.handlers.values()];
  }
}
