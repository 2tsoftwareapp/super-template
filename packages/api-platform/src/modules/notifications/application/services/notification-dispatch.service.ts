import { Inject, Injectable } from '@nestjs/common';
import {
  USER_PREFERENCES_LOOKUP,
  type UserPreferencesLookup,
} from '@repo/api-core';

import type { NotificationView } from '../notifications.types';

import { DELIVERIES_REPOSITORY, type DeliveriesRepositoryPort } from '../ports/deliveries.repository.port';
import { DEVICE_TOKENS_REPOSITORY, type DeviceTokensRepositoryPort } from '../ports/device-tokens.repository.port';
import { NOTIFICATION_STREAM_SERVICE, type NotificationStreamServicePort } from '../ports/notification-stream.service.port';

@Injectable()
export class NotificationDispatchService {
  constructor(
    @Inject(NOTIFICATION_STREAM_SERVICE) private readonly notificationStreamService: NotificationStreamServicePort,
    @Inject(DELIVERIES_REPOSITORY) private readonly deliveriesRepository: DeliveriesRepositoryPort,
    @Inject(DEVICE_TOKENS_REPOSITORY) private readonly deviceTokensRepository: DeviceTokensRepositoryPort,
    @Inject(USER_PREFERENCES_LOOKUP)
    private readonly userPreferencesLookup: UserPreferencesLookup,
  ) {}

  dispatch(notification: NotificationView, organizationId: string) {
    this.notificationStreamService.emit(notification.userId, organizationId, notification);

    // Upsert delivery rows for push — best-effort; inbox state remains the source of truth
    void this.upsertDeliveries(notification);
  }

  private async upsertDeliveries(notification: NotificationView) {
    try {
      const preferences = await this.userPreferencesLookup
        .findNotificationPreferencesByUserId(notification.userId);

      if (!preferences.push) {
        return;
      }

      const tokens = await this.deviceTokensRepository.listByUserId(notification.userId);

      if (tokens.length === 0) {
        return;
      }

      await this.deliveriesRepository.upsertBatch(
        tokens.map((token) => ({
          notificationId: notification.id,
          deviceTokenId: token.id,
          channel: 'fcm',
        })),
      );
    } catch {
      // Delivery row upsert is best-effort
    }
  }

  streamForUser(userId: string, organizationId: string) {
    return this.notificationStreamService.stream(userId, organizationId);
  }
}

