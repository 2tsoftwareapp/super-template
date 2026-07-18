import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { notifications } from '@repo/api-database';
import { and, count, desc, eq, isNull } from 'drizzle-orm';

import type { NotificationsRepositoryPort } from '../application/ports/notifications.repository.port';

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

    // Use ON CONFLICT DO NOTHING so retry jobs don't create duplicate inbox items
    // (idempotency guaranteed by unique constraint on source_job_id + user_id — T-004)
    return executor
      .insert(notifications)
      .values(values)
      .onConflictDoNothing()
      .returning();
  }

  async findById(
    notificationId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [notification] = await executor
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.organizationId, organizationId)))
      .limit(1);

    return notification ?? null;
  }

  async listForUser(
    userId: string,
    organizationId: string,
    params: ListNotificationsParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = [eq(notifications.userId, userId), eq(notifications.organizationId, organizationId)];

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
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [row] = await executor
      .select({ total: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.organizationId, organizationId), isNull(notifications.readAt)),
      );

    return Number(row?.total ?? 0);
  }

  async markRead(
    notificationId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [notification] = await executor
      .update(notifications)
      .set({
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, notificationId), eq(notifications.organizationId, organizationId)))
      .returning();

    return notification ?? null;
  }

  async markAllRead(
    userId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .update(notifications)
      .set({
        readAt: new Date(),
      })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.organizationId, organizationId), isNull(notifications.readAt)),
      );
  }

  async delete(
    notificationId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [notification] = await executor
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.organizationId, organizationId)))
      .returning();

    return notification ?? null;
  }
}
