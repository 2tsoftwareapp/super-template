import type { NotificationJobRecord } from './notification-jobs.repository.port';
import type { NotificationRecord } from './notifications.repository.port';
import type { NotificationJobView, NotificationView } from './notifications.types';

export class NotificationsMapper {
  toNotificationView(notification: NotificationRecord): NotificationView {
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

  toNotificationJobView(job: NotificationJobRecord): NotificationJobView {
    return {
      id: job.id,
      actorId: job.actorId,
      audience: job.audience,
      targetUserId: job.targetUserId,
      userIds: job.userIds ?? null,
      type: job.type,
      title: job.title,
      body: job.body,
      data: job.data ?? null,
      scheduledAt: job.scheduledAt.toISOString(),
      status: job.status,
      recipientCount: job.recipientCount,
      processedAt: job.processedAt?.toISOString() ?? null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  /** @deprecated Use toNotificationView */
  toNotificationDto(notification: NotificationRecord): NotificationView {
    return this.toNotificationView(notification);
  }

  /** @deprecated Use toNotificationJobView */
  toNotificationJobDto(job: NotificationJobRecord): NotificationJobView {
    return this.toNotificationJobView(job);
  }
}
