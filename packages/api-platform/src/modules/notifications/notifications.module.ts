import { Module } from '@nestjs/common';
import { USER_NOTIFICATION_SENDER } from '@repo/api-core';

import { NotificationsMapper } from './application/notifications.mapper';
import { NotificationsService } from './application/notifications.service';
import { DEVICE_TOKENS_REPOSITORY } from './application/ports/device-tokens.repository.port';
import { NOTIFICATION_JOBS_REPOSITORY } from './application/ports/notification-jobs.repository.port';
import { NOTIFICATION_STREAM_SERVICE } from './application/ports/notification-stream.service.port';
import { NOTIFICATIONS_REPOSITORY } from './application/ports/notifications.repository.port';
import { PUSH_NOTIFIER } from './application/push.interface';
import { NotificationDispatchService } from './application/services/notification-dispatch.service';
import { NotificationJobsProcessor } from './application/services/notification-jobs.processor';
import { NotificationDeliveryUseCase } from './application/use-cases/notification-delivery.use-case';
import { NotificationDeviceUseCase } from './application/use-cases/notification-device.use-case';
import { NotificationInboxUseCase } from './application/use-cases/notification-inbox.use-case';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { DeviceTokensRepository } from './infrastructure/device-tokens.repository';
import { FcmPushService } from './infrastructure/fcm-push.service';
import { NotificationJobsRepository } from './infrastructure/notification-jobs.repository';
import { NotificationStreamService } from './infrastructure/notification-stream.service';
import { NotificationsRepository } from './infrastructure/notifications.repository';
import {
  AdminNotificationsController,
  NotificationsController,
} from './presentation/notifications.controller';

@Module({
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsRepository,
    NotificationJobsRepository,
    DeviceTokensRepository,
    NotificationStreamService,
    FcmPushService,
    NotificationsMapper,
    NotificationDispatchService,
    SendNotificationUseCase,
    NotificationDeliveryUseCase,
    NotificationInboxUseCase,
    NotificationDeviceUseCase,
    NotificationsService,
    NotificationJobsProcessor,
    {
      provide: PUSH_NOTIFIER,
      useExisting: FcmPushService,
    },
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useExisting: NotificationsRepository,
    },
    {
      provide: NOTIFICATION_JOBS_REPOSITORY,
      useExisting: NotificationJobsRepository,
    },
    {
      provide: DEVICE_TOKENS_REPOSITORY,
      useExisting: DeviceTokensRepository,
    },
    {
      provide: NOTIFICATION_STREAM_SERVICE,
      useExisting: NotificationStreamService,
    },
    {
      provide: USER_NOTIFICATION_SENDER,
      useExisting: NotificationsService,
    },
  ],
  exports: [
    NotificationsService,
    USER_NOTIFICATION_SENDER,
    NOTIFICATIONS_REPOSITORY,
    NOTIFICATION_JOBS_REPOSITORY,
    DEVICE_TOKENS_REPOSITORY,
    NOTIFICATION_STREAM_SERVICE,
  ],
})
export class NotificationsModule {}
