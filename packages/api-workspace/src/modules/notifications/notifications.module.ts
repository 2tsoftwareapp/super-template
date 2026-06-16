import { Module } from '@nestjs/common';
import { AuditModule } from '@repo/api-platform/modules/audit/audit.module';
import { UsersModule } from '@repo/api-identity/modules/users/users.module';
import { NotificationJobsProcessor } from './application/notification-jobs.processor';
import { NotificationsService } from './application/notifications.service';
import { PUSH_NOTIFIER } from './application/push.interface';
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
  imports: [AuditModule, UsersModule],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsRepository,
    NotificationJobsRepository,
    DeviceTokensRepository,
    NotificationStreamService,
    FcmPushService,
    NotificationsService,
    NotificationJobsProcessor,
    {
      provide: PUSH_NOTIFIER,
      useExisting: FcmPushService,
    },
  ],
  exports: [NotificationsRepository, NotificationsService],
})
export class NotificationsModule {}
