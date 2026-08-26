import type { TransactionExecutor } from "@repo/api-runtime";

import { Inject, Injectable, Logger } from "@nestjs/common";
import { USER_PREFERENCES_LOOKUP, type UserPreferencesLookup } from "@repo/api-runtime";

import type { NotificationView } from "../notifications.types";

import {
  DELIVERIES_REPOSITORY,
  type DeliveriesRepositoryPort,
} from "../ports/deliveries.repository.port";
import {
  DEVICE_TOKENS_REPOSITORY,
  type DeviceTokensRepositoryPort,
} from "../ports/device-tokens.repository.port";
import {
  NOTIFICATION_STREAM_SERVICE,
  type NotificationStreamServicePort,
} from "../ports/notification-stream.service.port";

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    @Inject(NOTIFICATION_STREAM_SERVICE)
    private readonly notificationStreamService: NotificationStreamServicePort,
    @Inject(DELIVERIES_REPOSITORY) private readonly deliveriesRepository: DeliveriesRepositoryPort,
    @Inject(DEVICE_TOKENS_REPOSITORY)
    private readonly deviceTokensRepository: DeviceTokensRepositoryPort,
    @Inject(USER_PREFERENCES_LOOKUP)
    private readonly userPreferencesLookup: UserPreferencesLookup,
  ) {}

  dispatch(notification: NotificationView, organizationId: string) {
    this.emitSSE(notification, organizationId);
    void this.upsertDeliveries(notification);
  }

  /**
   * Emit SSE event only, without upserting delivery rows.
   * Used after transactional delivery upsert in processClaimedJob.
   */
  emitSSE(notification: NotificationView, organizationId: string) {
    this.notificationStreamService.emit(notification.userId, organizationId, notification);
  }

  private async upsertDeliveries(notification: NotificationView) {
    try {
      await this.upsertDeliveriesForNotification(notification);
    } catch (error) {
      this.logger.error(
        `Failed to upsert deliveries for notification ${notification.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Upsert delivery rows for a notification, inside the given transaction.
   * Returns the notification to allow the caller to emit SSE after commit.
   */
  async upsertDeliveriesForNotification(
    notification: NotificationView,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const preferences = await this.userPreferencesLookup.findNotificationPreferencesByUserId(
      notification.userId,
    );

    if (!preferences.push) {
      return;
    }

    const tokens = await this.deviceTokensRepository.listByUserId(notification.userId, executor);

    if (tokens.length === 0) {
      return;
    }

    await this.deliveriesRepository.upsertBatch(
      tokens.map((token) => ({
        notificationId: notification.id,
        deviceTokenId: token.id,
        channel: "fcm",
      })),
      executor,
    );
  }

  streamForUser(userId: string, organizationId: string) {
    return this.notificationStreamService.stream(userId, organizationId);
  }
}
