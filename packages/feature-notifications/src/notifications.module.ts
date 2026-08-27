import { Global, Module } from "@nestjs/common";

import {
  NOTIFICATION_JOB_HANDLER_PROVIDER,
  NotificationJobHandler,
} from "./application/notification-job.handler";
import { NotificationsMapper } from "./application/notifications.mapper";
import { NotificationsService } from "./application/notifications.service";
import { DELIVERIES_REPOSITORY } from "./application/ports/deliveries.repository.port";
import { DEVICE_TOKENS_REPOSITORY } from "./application/ports/device-tokens.repository.port";
import { NOTIFICATION_JOBS_REPOSITORY } from "./application/ports/notification-jobs.repository.port";
import { NOTIFICATION_STREAM_SERVICE } from "./application/ports/notification-stream.service.port";
import { NOTIFICATIONS_REPOSITORY } from "./application/ports/notifications.repository.port";
import { PUSH_NOTIFIER } from "./application/ports/push.interface";
import { NotificationDeliveryProcessor } from "./application/services/notification-delivery.processor";
import { NotificationDispatchService } from "./application/services/notification-dispatch.service";
import { NotificationJobsProcessor } from "./application/services/notification-jobs.processor";
import { NotificationDeliveryUseCase } from "./application/use-cases/notification-delivery.use-case";
import { NotificationDeviceUseCase } from "./application/use-cases/notification-device.use-case";
import { NotificationInboxUseCase } from "./application/use-cases/notification-inbox.use-case";
import { SendNotificationUseCase } from "./application/use-cases/send-notification.use-case";
import { DeliveriesRepository } from "./infrastructure/deliveries.repository";
import { DeviceTokensRepository } from "./infrastructure/device-tokens.repository";
import { FcmPushService } from "./infrastructure/fcm-push.service";
import { NotificationJobsRepository } from "./infrastructure/notification-jobs.repository";
import { NotificationStreamService } from "./infrastructure/notification-stream.service";
import { NotificationsRepository } from "./infrastructure/notifications.repository";
import {
  AdminNotificationsController,
  NotificationsController,
} from "./presentation/notifications.controller";
import { USER_NOTIFICATION_SENDER } from "./public/user-notification-sender.port";

@Global()
@Module({
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsRepository,
    NotificationJobsRepository,
    DeviceTokensRepository,
    DeliveriesRepository,
    NotificationStreamService,
    {
      provide: DEVICE_TOKENS_REPOSITORY,
      useExisting: DeviceTokensRepository,
    },
    FcmPushService,
    NotificationsMapper,
    NotificationDispatchService,
    SendNotificationUseCase,
    NotificationDeliveryUseCase,
    NotificationInboxUseCase,
    NotificationDeviceUseCase,
    NotificationsService,
    NotificationJobsProcessor,
    NotificationDeliveryProcessor,
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
      provide: DELIVERIES_REPOSITORY,
      useExisting: DeliveriesRepository,
    },
    {
      provide: NOTIFICATION_STREAM_SERVICE,
      useExisting: NotificationStreamService,
    },
    {
      provide: USER_NOTIFICATION_SENDER,
      useExisting: NotificationsService,
    },
    NotificationJobHandler,
    NOTIFICATION_JOB_HANDLER_PROVIDER,
  ],
  exports: [
    NotificationsService,
    NotificationDeliveryUseCase,
    NotificationDeliveryProcessor,
    USER_NOTIFICATION_SENDER,
    NOTIFICATIONS_REPOSITORY,
    NOTIFICATION_JOBS_REPOSITORY,
    DEVICE_TOKENS_REPOSITORY,
    DELIVERIES_REPOSITORY,
    NOTIFICATION_STREAM_SERVICE,
    PUSH_NOTIFIER,
  ],
})
export class NotificationsModule {}
