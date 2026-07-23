import type { JsonObject, TransactionExecutor } from '@repo/api-core';

export type JobScope =
  | { type: 'organization'; organizationId: string }
  | { type: 'platform' };

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
  processingStartedAt: Date | null;
  leaseExpiresAt: Date | null;
  workerId: string | null;
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
  scope: JobScope;
  page: number;
  limit: number;
  status?: string;
  type?: string;
}

export interface JobsRepositoryPort {
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
      processingStartedAt?: Date | null;
      leaseExpiresAt?: Date | null;
      workerId?: string | null;
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
      processingStartedAt?: Date | null;
      leaseExpiresAt?: Date | null;
      workerId?: string | null;
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
    scope: JobScope,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;

  findByIdempotencyKey(
    organizationId: string | null,
    createdById: string,
    idempotencyKey: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  list(
    params: ListJobsParams,
    executor?: TransactionExecutor,
  ): Promise<{ rows: JobRecord[]; total: number }>;
  markCancelled(
    jobId: string,
    scope: JobScope,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  claimDueJobs(
    limit: number,
    workerId: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord[]>;
  markCompleted(
    jobId: string,
    workerId: string,
    attempts: number,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  markFailed(
    jobId: string,
    message: string,
    workerId: string,
    attempts: number,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  requeueForRetry(
    jobId: string,
    scheduledAt: Date,
    message: string,
    workerId: string,
    attempts: number,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  acquireDependencyGraphLock(
    scope: JobScope,
    executor?: TransactionExecutor,
  ): Promise<void>;
  recoverStaleProcessing(executor?: TransactionExecutor): Promise<{
    requeued: JobRecord[];
    failed: JobRecord[];
  }>;
  markBlocked(
    jobId: string,
    message: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null>;
  listDependents(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<{ id: string; jobId: string; status: string }[]>;
}

export const JOBS_REPOSITORY = Symbol('JOBS_REPOSITORY');