import { Module } from '@nestjs/common';
import { USER_NOTIFICATION_SENDER } from '@repo/api-core';

import { NotificationDeliveryUseCase } from './application/notification-delivery.use-case';
import { NotificationDeviceUseCase } from './application/notification-device.use-case';
import { NotificationDispatchService } from './application/notification-dispatch.service';
import { NotificationInboxUseCase } from './application/notification-inbox.use-case';
import { NotificationJobsProcessor } from './application/notification-jobs.processor';
import { NOTIFICATION_JOBS_REPOSITORY } from './application/notification-jobs.repository.port';
import { NotificationsMapper } from './application/notifications.mapper';
import { NOTIFICATIONS_REPOSITORY } from './application/notifications.repository.port';
import { NotificationsService } from './application/notifications.service';
import { PUSH_NOTIFIER } from './application/push.interface';
import { SendNotificationUseCase } from './application/send-notification.use-case';
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
      provide: USER_NOTIFICATION_SENDER,
      useExisting: NotificationsService,
    },
  ],
  exports: [
    NotificationsRepository,
    NotificationsService,
    USER_NOTIFICATION_SENDER,
    NOTIFICATIONS_REPOSITORY,
    NOTIFICATION_JOBS_REPOSITORY,
  ],
})
export class NotificationsModule {}
