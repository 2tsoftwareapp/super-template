import type { JsonObject } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

import type { ListNotificationsQuery } from '../notifications.types';

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
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord | null>;
  createMany(
    values: CreateNotificationInput[],
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord[]>;
  findById(
    notificationId: string,
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord | null>;
  listForUser(
    userId: string,
    params: ListNotificationsQuery,
    executor?: TransactionExecutor,
  ): Promise<NotificationsListResult>;
  getUnreadCount(userId: string, executor?: TransactionExecutor): Promise<number>;
  markRead(
    notificationId: string,
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord | null>;
  markAllRead(userId: string, executor?: TransactionExecutor): Promise<void>;
  delete(
    notificationId: string,
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord | null>;
}

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');