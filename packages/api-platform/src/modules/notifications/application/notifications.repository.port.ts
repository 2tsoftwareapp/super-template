import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import type { ListNotificationsQuery } from './notifications.types';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: JsonObject | null;
  readAt: Date | null;
  organizationId: string | null;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: JsonObject | null | undefined;
  readAt?: Date | null;
  organizationId: string;
}

export interface NotificationsListResult {
  rows: NotificationRecord[];
  total: number;
}

export interface NotificationsRepositoryPort {
  create(
    values: CreateNotificationInput,
    executor?: DatabaseExecutor,
  ): Promise<NotificationRecord | null>;
  createMany(
    values: CreateNotificationInput[],
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
