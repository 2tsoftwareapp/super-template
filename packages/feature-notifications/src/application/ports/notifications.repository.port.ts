import type { JsonObject } from "@repo/api-kernel";
import type { TransactionExecutor } from "@repo/api-kernel";

import type { ListNotificationsQuery } from "../notifications.types";

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
  sourceJobId?: string | null;
  sourceBackgroundJobId?: string | null;
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
  /**
   * Idempotent create for job-sourced inbox rows: exactly one row per
   * (sourceJobId, userId). Rows the unique index already holds are replayed
   * instead of duplicated, so retrying a job converges on the same rows.
   * Every created row shares `sourceJobId`.
   */
  createManyIdempotent(
    sourceJobId: string,
    recipients: Array<Omit<CreateNotificationInput, "sourceJobId">>,
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord[]>;
  findBySourceJobAndUsers(
    sourceJobId: string,
    userIds: string[],
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord[]>;
  findBySourceBackgroundJobId(
    sourceBackgroundJobId: string,
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord | null>;
  findById(
    notificationId: string,
    organizationId?: string,
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord | null>;
  listForUser(
    userId: string,
    organizationId: string,
    params: ListNotificationsQuery,
    executor?: TransactionExecutor,
  ): Promise<NotificationsListResult>;
  getUnreadCount(
    userId: string,
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<number>;
  markRead(
    notificationId: string,
    userId: string,
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord | null>;
  markAllRead(
    userId: string,
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<void>;
  delete(
    notificationId: string,
    userId: string,
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<NotificationRecord | null>;
}

export const NOTIFICATIONS_REPOSITORY = Symbol("NOTIFICATIONS_REPOSITORY");
