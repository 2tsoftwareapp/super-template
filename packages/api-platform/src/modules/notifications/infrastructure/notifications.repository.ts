import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { notifications } from '@repo/api-database';
import { and, count, desc, eq, isNull } from 'drizzle-orm';

import type { NotificationsRepositoryPort } from '../application/notifications.repository.port';

interface ListNotificationsParams {
  page: number;
  limit: number;
  unread?: boolean;
  type?: string;
}

@Injectable()
export class NotificationsRepository implements NotificationsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof notifications.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [notification] = await executor
      .insert(notifications)
      .values(values)
      .returning();
    return notification ?? null;
  }

  async createMany(
    values: typeof notifications.$inferInsert[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (values.length === 0) {
      return [];
    }

    return executor.insert(notifications).values(values).returning();
  }

  async findById(
    notificationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [notification] = await executor
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    return notification ?? null;
  }

  async listForUser(
    userId: string,
    params: ListNotificationsParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = [eq(notifications.userId, userId)];

    if (params.unread === true) {
      filters.push(isNull(notifications.readAt));
    }

    if (params.type) {
      filters.push(eq(notifications.type, params.type));
    }

    const whereClause = and(...filters);
    const offset = (params.page - 1) * params.limit;
    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(params.limit)
        .offset(offset),
      executor
        .select({ total: count() })
        .from(notifications)
        .where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async getUnreadCount(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [row] = await executor
      .select({ total: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );

    return Number(row?.total ?? 0);
  }

  async markRead(
    notificationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [notification] = await executor
      .update(notifications)
      .set({
        readAt: new Date(),
      })
      .where(eq(notifications.id, notificationId))
      .returning();

    return notification ?? null;
  }

  async markAllRead(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .update(notifications)
      .set({
        readAt: new Date(),
      })
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );
  }

  async delete(
    notificationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [notification] = await executor
      .delete(notifications)
      .where(eq(notifications.id, notificationId))
      .returning();

    return notification ?? null;
  }
}
