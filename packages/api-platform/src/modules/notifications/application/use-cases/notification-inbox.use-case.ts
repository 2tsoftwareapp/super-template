import type { AuthenticatedRequestUser } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, requireOrganizationId } from "@repo/api-core";

import type { ListNotificationsQuery, NotificationView } from "../notifications.types";

import { NotificationsMapper } from "../notifications.mapper";
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from "../ports/notifications.repository.port";

@Injectable()
export class NotificationInboxUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepositoryPort,
    private readonly notificationsMapper: NotificationsMapper,
  ) {}

  async listForUser(user: AuthenticatedRequestUser, query: ListNotificationsQuery) {
    // Scope inbox strictly to the active organization — tenant isolation (T-002/T-003)
    const organizationId = requireOrganizationId(user);
    const result = await this.notificationsRepository.listForUser(
      user.userId,
      organizationId,
      query,
    );

    return {
      rows: result.rows.map((row) => this.notificationsMapper.toNotificationView(row)),
      total: result.total,
    };
  }

  async unreadCount(user: AuthenticatedRequestUser) {
    const organizationId = requireOrganizationId(user);
    return this.notificationsRepository.getUnreadCount(user.userId, organizationId);
  }

  async markRead(
    user: AuthenticatedRequestUser,
    notificationId: string,
  ): Promise<NotificationView> {
    const organizationId = requireOrganizationId(user);

    // findById scoped to org+user — prevents cross-tenant read (T-003)
    const notification = await this.notificationsRepository.findById(
      notificationId,
      organizationId,
    );

    if (notification?.userId !== user.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        "Notification not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.notificationsRepository.markRead(
      notificationId,
      user.userId,
      organizationId,
    );
    return this.notificationsMapper.toNotificationView(updated ?? notification);
  }

  async markAllRead(user: AuthenticatedRequestUser) {
    const organizationId = requireOrganizationId(user);
    await this.notificationsRepository.markAllRead(user.userId, organizationId);
  }

  async delete(user: AuthenticatedRequestUser, notificationId: string) {
    const organizationId = requireOrganizationId(user);

    // findById scoped to org — prevents cross-tenant delete (T-003)
    const notification = await this.notificationsRepository.findById(
      notificationId,
      organizationId,
    );

    if (notification?.userId !== user.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        "Notification not found",
        HttpStatus.NOT_FOUND,
      );
    }

    await this.notificationsRepository.delete(notificationId, user.userId, organizationId);
  }
}
