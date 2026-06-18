import type { DatabaseExecutor } from '@repo/api-database';

import type { NotificationJobsRepository } from '../infrastructure/notification-jobs.repository';
import type { ListNotificationJobsQuery } from './notifications.types';

export type NotificationJobRecord = NonNullable<
  Awaited<ReturnType<NotificationJobsRepository['findById']>>
>;

export interface NotificationJobsListResult {
  rows: NotificationJobRecord[];
  total: number;
}

export interface NotificationJobsRepositoryPort {
  create(
    values: Parameters<NotificationJobsRepository['create']>[0],
    executor?: DatabaseExecutor,
  ): Promise<NotificationJobRecord | null>;
  createIdempotent(
    values: Parameters<NotificationJobsRepository['createIdempotent']>[0],
    executor?: DatabaseExecutor,
  ): ReturnType<NotificationJobsRepository['createIdempotent']>;
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
