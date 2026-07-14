import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import type { ListNotificationJobsQuery } from '../notifications.types';

export type NotificationJobAudience = 'ALL' | 'USER' | 'USERS';
export type NotificationJobStatusType = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface NotificationJobRecord {
  id: string;
  organizationId: string | null;
  actorId: string | null;
  audience: NotificationJobAudience;
  targetUserId: string | null;
  userIds: string[] | null;
  type: string;
  title: string;
  body: string;
  data: JsonObject | null;
  scheduledAt: Date;
  status: NotificationJobStatusType;
  recipientCount: number | null;
  processedAt: Date | null;
  errorMessage: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationJobInput {
  organizationId?: string | null;
  actorId?: string | null;
  audience: NotificationJobAudience;
  targetUserId?: string | null;
  userIds?: string[] | null;
  type: string;
  title: string;
  body: string;
  data?: JsonObject | null;
  scheduledAt: Date;
  status?: NotificationJobStatusType;
  recipientCount?: number | null;
  processedAt?: Date | null;
  errorMessage?: string | null;
  idempotencyKey?: string | null;
}

export interface CreateIdempotentNotificationJobInput {
  organizationId?: string | null;
  actorId: string;
  audience: NotificationJobAudience;
  targetUserId?: string | null;
  userIds?: string[] | null;
  type: string;
  title: string;
  body: string;
  data?: JsonObject | null;
  scheduledAt: Date;
  status?: NotificationJobStatusType;
  recipientCount?: number | null;
  processedAt?: Date | null;
  errorMessage?: string | null;
  idempotencyKey: string;
}

export interface NotificationJobsListResult {
  rows: NotificationJobRecord[];
  total: number;
}

export interface NotificationJobsRepositoryPort {
  create(
    values: CreateNotificationJobInput,
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobRecord | null>;
  createIdempotent(
    values: CreateIdempotentNotificationJobInput,
    executor?: DatabaseExecutor,
  ): Promise<{ value: NotificationJobRecord; created: boolean } | null>;
  findById(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobRecord | null>;
  list(
    params: ListNotificationJobsQuery,
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobsListResult>;
  listDue(
    limit: number,
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobRecord[]>;
  markProcessing(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobRecord | null>;
  markCompleted(
    jobId: string,
    recipientCount: number,
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobRecord | null>;
  markFailed(
    jobId: string,
    errorMessage: string,
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobRecord | null>;
  markCancelled(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobRecord | null>;
}

export const NOTIFICATION_JOBS_REPOSITORY = Symbol(
  'NOTIFICATION_JOBS_REPOSITORY',
);