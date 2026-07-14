import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type {
  ListNotificationsQuery,
  NotificationView,
} from '../notifications.types';

import { NotificationsMapper } from '../notifications.mapper';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from '../ports/notifications.repository.port';

@Injectable()
export class NotificationInboxUseCase {
  private readonly notificationsMapper = new NotificationsMapper();

  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepositoryPort,
  ) {}

  async listForUser(
    user: AuthenticatedRequestUser,
    query: ListNotificationsQuery,
  ) {
    const result = await this.notificationsRepository.listForUser(
      user.userId,
      query,
    );

    return {
      rows: result.rows.map((row) =>
        this.notificationsMapper.toNotificationView(row),
      ),
      total: result.total,
    };
  }

  async unreadCount(user: AuthenticatedRequestUser) {
    return this.notificationsRepository.getUnreadCount(user.userId);
  }

  async markRead(
    user: AuthenticatedRequestUser,
    notificationId: string,
  ): Promise<NotificationView> {
    const notification =
      await this.notificationsRepository.findById(notificationId);

    if (notification?.userId !== user.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.notificationsRepository.markRead(notificationId);
    return this.notificationsMapper.toNotificationView(
      updated ?? notification,
    );
  }

  async markAllRead(user: AuthenticatedRequestUser) {
    await this.notificationsRepository.markAllRead(user.userId);
  }

  async delete(user: AuthenticatedRequestUser, notificationId: string) {
    const notification =
      await this.notificationsRepository.findById(notificationId);

    if (notification?.userId !== user.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.notificationsRepository.delete(notificationId);
  }
}
