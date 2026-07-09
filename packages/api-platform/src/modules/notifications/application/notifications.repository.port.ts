import type { DatabaseExecutor } from '@repo/api-database';

import type { NotificationsRepository } from '../infrastructure/notifications.repository';
import type { ListNotificationsQuery } from './notifications.types';

export type NotificationRecord = NonNullable<
  Awaited<ReturnType<NotificationsRepository['findById']>>
>;

export interface NotificationsListResult {
  rows: NotificationRecord[];
  total: number;
}

export interface NotificationsRepositoryPort {
  create(
    values: Parameters<NotificationsRepository['create']>[0],
    executor?: DatabaseExecutor,
  ): Promise<NotificationRecord | null>;
  createMany(
    values: Parameters<NotificationsRepository['createMany']>[0],
    executor?: DatabaseExecutor,
  ): Promise<NotificationRecord[]>;
  findById(
    notificationId: string,
    executor?: DatabaseExecutor,
  ): Promise<NotificationRecord | null>;
  listForUser(
    userId: string,
    params: ListNotificationsQuery,
    executor?: DatabaseExecutor,
  ): Promise<NotificationsListResult>;
  getUnreadCount(userId: string, executor?: DatabaseExecutor): Promise<number>;
  markRead(
    notificationId: string,
    executor?: DatabaseExecutor,
  ): Promise<NotificationRecord | null>;
  markAllRead(userId: string, executor?: DatabaseExecutor): Promise<void>;
  delete(
    notificationId: string,
    executor?: DatabaseExecutor,
  ): Promise<NotificationRecord | null>;
}

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');
