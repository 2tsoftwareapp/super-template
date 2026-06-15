import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationsService } from './application/notifications.service';
import { NotificationsRepository } from './infrastructure/notifications.repository';
import {
  AdminNotificationsController,
  NotificationsController,
} from './presentation/notifications.controller';

@Module({
  imports: [AuditModule],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [NotificationsRepository, NotificationsService],
  exports: [NotificationsRepository, NotificationsService],
})
export class NotificationsModule {}
