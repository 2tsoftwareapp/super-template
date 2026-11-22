import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { NotificationRow } from "@lean/db";

import { isForeignKeyViolation } from "../../shared/database-errors";
import { AppError, ERROR_CODES } from "../../shared/errors";
import { buildPageMeta, type PageMeta } from "../../shared/pagination";
import { NotificationsRepository, type CreateNotificationInput } from "./notifications.repository";
import type { NotificationDto } from "./notifications.dto";

const toNotificationDto = (row: NotificationRow): NotificationDto => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body,
  readAt: row.readAt ? row.readAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NotificationsRepository) private readonly notifications: NotificationsRepository,
  ) {}

  async create(input: CreateNotificationInput): Promise<NotificationDto> {
    try {
      return toNotificationDto(await this.notifications.create(input));
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
      }

      throw error;
    }
  }

  async listForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: NotificationDto[]; meta: PageMeta & { unread: number } }> {
    const { rows, total, unread } = await this.notifications.listForUser(userId, page, limit);

    return {
      data: rows.map(toNotificationDto),
      meta: { ...buildPageMeta(total, page, limit), unread },
    };
  }

  async markRead(id: string, userId: string): Promise<NotificationDto> {
    const row = await this.notifications.markRead(id, userId);

    if (!row) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        "Notification not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return toNotificationDto(row);
  }
}
