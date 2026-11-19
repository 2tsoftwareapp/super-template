import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { notifications, type NotificationRow } from "@lean/db";

import { DatabaseService } from "../../shared/database.service";

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
}

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async create(input: CreateNotificationInput): Promise<NotificationRow> {
    const [row] = await this.database.db.insert(notifications).values(input).returning();

    if (!row) {
      throw new Error("Notification insert returned no row");
    }

    return row;
  }

  async listForUser(userId: string, page: number, limit: number) {
    const [rows, [totalRow], [unreadRow]] = await Promise.all([
      this.database.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.db
        .select({ value: count() })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
      this.database.db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
    ]);

    return {
      rows,
      total: Number(totalRow?.value ?? 0),
      unread: Number(unreadRow?.value ?? 0),
    };
  }

  async markRead(id: string, userId: string): Promise<NotificationRow | null> {
    const [row] = await this.database.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    return row ?? null;
  }
}
