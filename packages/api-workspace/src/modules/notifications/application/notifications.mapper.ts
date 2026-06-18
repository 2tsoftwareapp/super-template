import type { NotificationJobsRepository } from '../infrastructure/notification-jobs.repository';
import type { NotificationsRepository } from '../infrastructure/notifications.repository';
import type {
  NotificationAudienceDto,
  NotificationJobStatusDto} from '../presentation/notifications.dto';

import {
  type NotificationDto,
  type NotificationJobDto
} from '../presentation/notifications.dto';

type NotificationRecord = NonNullable<
  Awaited<ReturnType<NotificationsRepository['findById']>>
>;

type NotificationJobRecord = NonNullable<
  Awaited<ReturnType<NotificationJobsRepository['findById']>>
>;

export class NotificationsMapper {
  toNotificationDto(notification: NotificationRecord): NotificationDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data ?? null,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  toNotificationJobDto(job: NotificationJobRecord): NotificationJobDto {
    return {
      id: job.id,
      actorId: job.actorId,
      audience: job.audience as NotificationAudienceDto,
      targetUserId: job.targetUserId,
      userIds: job.userIds ?? null,
      type: job.type,
      title: job.title,
      body: job.body,
      data: job.data ?? null,
      scheduledAt: job.scheduledAt.toISOString(),
      status: job.status as NotificationJobStatusDto,
      recipientCount: job.recipientCount,
      processedAt: job.processedAt?.toISOString() ?? null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
