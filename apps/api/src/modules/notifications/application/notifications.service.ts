import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../common/constants/error-codes';
import { AppError } from '../../../common/errors/app-error';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '../../../common/types/request-context';
import type { DatabaseExecutor } from '../../../database/database.types';
import { AuditService } from '../../audit/application/audit.service';
import { NotificationsRepository } from '../infrastructure/notifications.repository';
import type {
  NotificationsQueryDto,
  SendNotificationDto,
} from '../presentation/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly auditService: AuditService,
  ) {}

  async sendToUser(
    actor: AuthenticatedRequestUser | null,
    input: SendNotificationDto,
    requestContext?: RequestContext,
    executor?: DatabaseExecutor,
  ) {
    const notification = await this.notificationsRepository.create(
      {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
      },
      executor,
    );

    if (!notification) {
      throw new Error('Notification insert returned no rows');
    }

    if (actor) {
      await this.auditService.log(
        {
          actorId: actor.userId,
          action: 'notification.sent',
          entityType: 'notification',
          entityId: notification.id,
          metadata: {
            userId: input.userId,
            type: input.type,
          },
          requestContext,
        },
        executor,
      );
    }

    return this.toNotificationDto(notification);
  }

  async listForUser(
    user: AuthenticatedRequestUser,
    query: NotificationsQueryDto,
  ) {
    const result = await this.notificationsRepository.listForUser(
      user.userId,
      query,
    );

    return {
      rows: result.rows.map((row) => this.toNotificationDto(row)),
      total: result.total,
    };
  }

  async unreadCount(user: AuthenticatedRequestUser) {
    return this.notificationsRepository.getUnreadCount(user.userId);
  }

  async markRead(user: AuthenticatedRequestUser, notificationId: string) {
    const notification =
      await this.notificationsRepository.findById(notificationId);

    if (!notification || notification.userId !== user.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.notificationsRepository.markRead(notificationId);
    return this.toNotificationDto(updated ?? notification);
  }

  async markAllRead(user: AuthenticatedRequestUser) {
    await this.notificationsRepository.markAllRead(user.userId);
  }

  async delete(user: AuthenticatedRequestUser, notificationId: string) {
    const notification =
      await this.notificationsRepository.findById(notificationId);

    if (!notification || notification.userId !== user.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.notificationsRepository.delete(notificationId);
  }

  private toNotificationDto(
    notification: Awaited<
      ReturnType<NotificationsRepository['findById']>
    > extends infer T
      ? Exclude<T, null>
      : never,
  ) {
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
}
