import type { AppLogger, TenantContext } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { APP_LOGGER, TenantContextService, WORKER_DISPATCH_CONTEXT } from "@repo/api-kernel";

import {
  OUTBOX_HANDLER_REGISTRY,
  type OutboxHandlerRegistryPort,
  type OutboxMessage,
} from "../public/outbox-handler.port";
import {
  OUTBOX_REPOSITORY,
  type OutboxRecord,
  type OutboxRepositoryPort,
} from "../public/outbox.port";

/**
 * Tenant context a claimed message's handler runs under. Messages published
 * before any tenant existed (registration, seeds) carry no organization and
 * therefore run in platform scope with `bypass_rls` off — they reach only rows
 * the database considers platform-scope.
 */
function tenantContextForMessage(message: OutboxRecord): TenantContext {
  return {
    tenantId: message.organizationId ?? "",
    userId: "",
    bypassRls: false,
  };
}

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
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingMessages(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      // Claiming, stale recovery and status updates sweep every tenant's
      // messages, so they run under the worker bypass context (`app.bypass_rls`
      // = true). Handlers then run under their own message's tenant context, so
      // anything they write is attributed and fenced to that tenant instead of
      // inheriting the shared worker connection.
      await this.tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT, async () => {
        await this.outboxRepository.recoverStaleProcessing();
        const messages = await this.outboxRepository.claimPending(10);

        for (const message of messages) {
          await this.tenantContextService.runAsync(tenantContextForMessage(message), () =>
            this.deliver(message),
          );
        }
      });
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
