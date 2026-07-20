import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  APP_LOGGER,
  type AppLogger,
  ErrorReporterService,
} from '@repo/api-core';

import type { PushMessage, PushNotifier } from '../push.interface';

import { DELIVERIES_REPOSITORY, type DeliveriesRepositoryPort } from '../ports/deliveries.repository.port';
import { DEVICE_TOKENS_REPOSITORY, type DeviceTokensRepositoryPort } from '../ports/device-tokens.repository.port';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepositoryPort } from '../ports/notifications.repository.port';
import { PUSH_NOTIFIER } from '../push.interface';

const DELIVERY_BATCH_SIZE = 50;
const MAX_RETRY_ATTEMPTS = 5;
const RECOVERY_INTERVAL = 10; // Run stale recovery every Nth tick (~5min at 30s interval)

@Injectable()
export class NotificationDeliveryProcessor {
  private processing = false;
  private tickCount = 0;

  constructor(
    @Inject(DELIVERIES_REPOSITORY)
    private readonly deliveriesRepository: DeliveriesRepositoryPort,
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepositoryPort,
    @Inject(DEVICE_TOKENS_REPOSITORY)
    private readonly deviceTokensRepository: DeviceTokensRepositoryPort,
    @Inject(PUSH_NOTIFIER)
    private readonly pushNotifier: PushNotifier,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    private readonly errorReporter: ErrorReporterService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processDeliveries() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      // Periodically recover stale PROCESSING deliveries that may be stuck from a crash
      this.tickCount++;
      if (this.tickCount >= RECOVERY_INTERVAL) {
        this.tickCount = 0;
        try {
          const recovered = await this.deliveriesRepository.recoverStaleProcessing(5);
          if (recovered.length > 0) {
            this.logger.warn(`Recovered ${recovered.length} stale delivery(ies) from PROCESSING`);
          }
        } catch (recoveryError) {
          this.logger.error('Stale delivery recovery failed', {
            error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
          });
        }
      }

      const deliveries = await this.deliveriesRepository.claimPending(
        DELIVERY_BATCH_SIZE,
      );

      if (deliveries.length === 0) {
        return;
      }

      const notificationIds = [...new Set(deliveries.map((d) => d.notificationId))];
      const tokenIds = [...new Set(deliveries.map((d) => d.deviceTokenId))];

      const [notifications, tokens] = await Promise.all([
        Promise.all(
          notificationIds.map((id) => this.notificationsRepository.findById(id)),
        ),
        this.deviceTokensRepository.listByIds(tokenIds),
      ]);

      const notificationMap = new Map(
        notifications.filter(Boolean).map((n) => [n!.id, n!]),
      );
      const tokenMap = new Map(
        tokens.map((t) => [t.id, t]),
      );

      for (const delivery of deliveries) {
        const notification = notificationMap.get(delivery.notificationId);
        const deviceToken = tokenMap.get(delivery.deviceTokenId);

        if (!notification || !deviceToken) {
          await this.deliveriesRepository.markFailed(
            delivery.id,
            'Missing notification or device token',
          );
          continue;
        }

        const message: PushMessage = {
          notificationId: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        };

        const result = await this.pushNotifier.sendToToken(
          deviceToken.token,
          message,
        );

        if (result.success) {
          await this.deliveriesRepository.markSent(
            delivery.id,
            result.providerMessageId,
          );
        } else if (result.error === 'INVALID_TOKEN') {
          await this.deviceTokensRepository.deleteTokens([deviceToken.token]);
          await this.deliveriesRepository.markFailed(
            delivery.id,
            'Invalid device token',
          );
          this.logger.warn(
            `Removed invalid token ${deviceToken.token} for delivery ${delivery.id}`,
          );
        } else if (delivery.attempts >= MAX_RETRY_ATTEMPTS) {
          await this.deliveriesRepository.markFailed(
            delivery.id,
            `Max retries exceeded: ${result.error}`,
          );
        } else {
          const backoffMinutes = Math.pow(2, delivery.attempts - 1);
          const nextAttemptAt = new Date(
            Date.now() + backoffMinutes * 60 * 1000,
          );
          await this.deliveriesRepository.markRetryable(
            delivery.id,
            nextAttemptAt,
          );
          this.logger.warn(
            `Delivery ${delivery.id} will retry in ${backoffMinutes}min (attempt ${delivery.attempts}/${MAX_RETRY_ATTEMPTS}): ${result.error}`,
          );
        }
      }
    } catch (error) {
      const logContext: Record<string, string> = {
        error: error instanceof Error ? error.message : String(error),
      };
      if (error instanceof Error && error.stack) {
        logContext.stack = error.stack;
      }
      this.logger.error('Failed to process delivery batch', logContext);
      if (error instanceof Error) {
        this.errorReporter.reportException(error, {
          errorCode: 'DELIVERY_PROCESSING_FAILED',
          tags: { job: 'notification-delivery-processor' },
        });
      } else {
        this.errorReporter.reportMessage(
          'Failed to process delivery batch',
          {
            errorCode: 'DELIVERY_PROCESSING_FAILED',
            tags: { job: 'notification-delivery-processor' },
          },
        );
      }
    } finally {
      this.processing = false;
    }
  }
}
