import type { JsonObject } from '@repo/api-core';
import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

export interface JobRecord {
  id: string;
  organizationId: string | null;
  type: string;
  payload: JsonObject;
  status: string;
  scheduledAt: Date;
  priority: number;
  attempts: number;
  maxAttempts: number;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  errorMessage: string | null;
  createdById: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ListJobsParams {
  page: number;
  limit: number;
  status?: string;
  type?: string;
}

export interface JobsRepositoryPort {
  readonly client: DatabaseClient;
  create(
    values: {
      id?: string;
      type: string;
      payload: JsonObject;
      status?: string;
      scheduledAt?: Date;
      priority?: number;
      attempts?: number;
      maxAttempts?: number;
      startedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      errorMessage?: string | null;
      organizationId?: string | null;
      createdById?: string | null;
      idempotencyKey?: string | null;
    },
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  createIdempotent(
    values: {
      id?: string;
      type: string;
      payload: JsonObject;
      status?: string;
      scheduledAt?: Date;
      priority?: number;
      attempts?: number;
      maxAttempts?: number;
      startedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      errorMessage?: string | null;
      organizationId?: string | null;
      createdById: string;
      idempotencyKey: string;
    },
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  findById(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  list(
    params: ListJobsParams,
    executor?: DatabaseExecutor,
  ): Promise<{ rows: JobRecord[]; total: number }>;
  markCancelled(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<JobRecord | null>;
  claimDueJobs(
    limit: number,
    executor?: DatabaseExecutor,
  ): Promise<JobRecord[]>;
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
