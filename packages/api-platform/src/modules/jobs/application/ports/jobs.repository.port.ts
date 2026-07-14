import type { JsonObject } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';
import type { DatabaseClient } from '@repo/api-database';

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
    executor?: TransactionExecutor,
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
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  findById(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  list(
    params: ListJobsParams,
    executor?: TransactionExecutor,
  ): Promise<{ rows: JobRecord[]; total: number }>;
  markCancelled(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  claimDueJobs(
    limit: number,
    executor?: TransactionExecutor,
  ): Promise<JobRecord[]>;
  markCompleted(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  markFailed(
    jobId: string,
    message: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  requeueForRetry(
    jobId: string,
    scheduledAt: Date,
    message: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
}

export const JOBS_REPOSITORY = Symbol('JOBS_REPOSITORY');