import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import type { JobsRepository } from '../infrastructure/jobs.repository';

export type JobRecord = NonNullable<
  Awaited<ReturnType<JobsRepository['findById']>>
>;

export interface JobsRepositoryPort {
  readonly client: DatabaseClient;
  create(
    values: Parameters<JobsRepository['create']>[0],
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  createIdempotent(
    values: Parameters<JobsRepository['createIdempotent']>[0],
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  findById(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  list(
    params: Parameters<JobsRepository['list']>[0],
    executor?: DatabaseExecutor,
  ): ReturnType<JobsRepository['list']>;
  markCancelled(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  claimDueJobs(
    limit: number,
    executor?: DatabaseExecutor,
  ): ReturnType<JobsRepository['claimDueJobs']>;
  markCompleted(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  markFailed(
    jobId: string,
    message: string,
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  requeueForRetry(
    jobId: string,
    scheduledAt: Date,
    message: string,
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
}

export const JOBS_REPOSITORY = Symbol('JOBS_REPOSITORY');
