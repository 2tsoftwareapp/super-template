import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { APP_LOGGER, type AppLogger } from "@repo/api-runtime";

import { OUTBOX_REPOSITORY, type OutboxRepositoryPort } from "../ports/outbox.repository.port";
import { AuthMailService } from "./auth-mail.service";

@Injectable()
export class OutboxProcessor {
  private processing = false;

  constructor(
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: OutboxRepositoryPort,
    private readonly authMailService: AuthMailService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingMessages() {
    if (this.processing) return;
    this.processing = true;

    try {
      await this.outboxRepository.recoverStaleProcessing();
      const messages = await this.outboxRepository.claimPending(10);

      for (const message of messages) {
        try {
          if (message.topic === "auth.send-verification-email") {
            await this.authMailService.sendVerificationEmail(
              message.payload.email,
              message.payload.token,
              message.payload.displayName,
            );
          }
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
    } catch (error) {
      this.logger.error("Outbox processing failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.processing = false;
    }
  }
}
