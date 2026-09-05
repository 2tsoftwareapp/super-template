import type { AppLogger } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { APP_LOGGER } from "@repo/api-kernel";

import {
  OUTBOX_HANDLER_REGISTRY,
  type OutboxHandlerRegistryPort,
  type OutboxMessage,
} from "../public/outbox-handler.port";
import { OUTBOX_REPOSITORY, type OutboxRepositoryPort } from "../public/outbox.port";

/**
 * Generic transactional-outbox dispatcher. Delivers claimed messages to the
 * feature-contributed handler for their topic; the core never imports an
 * owning feature.
 */
@Injectable()
export class OutboxDispatcher {
  private processing = false;

  constructor(
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    @Inject(OUTBOX_REPOSITORY) private readonly outboxRepository: OutboxRepositoryPort,
    @Inject(OUTBOX_HANDLER_REGISTRY)
    private readonly handlerRegistry: OutboxHandlerRegistryPort,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingMessages(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      await this.outboxRepository.recoverStaleProcessing();
      const messages = await this.outboxRepository.claimPending(10);

      for (const message of messages) {
        await this.deliver(message);
      }
    } catch (error) {
      this.logger.error("Outbox processing failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.processing = false;
    }
  }

  private async deliver(message: OutboxMessage): Promise<void> {
    const handler = this.handlerRegistry.getAll().find((h) => h.topic === message.topic);

    if (!handler) {
      // No subscriber composed for this topic: park it as failed so it does
      // not retry forever. Producers must tolerate missing consumers.
      await this.outboxRepository.markFailed(message.id, "no handler registered for topic");
      return;
    }

    try {
      await handler.handle(message);
      await this.outboxRepository.markSent(message.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn("Outbox message failed, will retry", {
        messageId: message.id,
        topic: message.topic,
        attempts: message.attempts,
        maxAttempts: message.maxAttempts,
        error: errorMessage,
      });
      await this.outboxRepository.markFailed(message.id, errorMessage);
    }
  }
}
