import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

export interface JobObservabilityRepositoryPort {
  startAttempt(
    values: {
      jobId: string;
      organizationId: string | null;
      attemptNumber: number;
    },
    executor?: DatabaseExecutor,
  ): Promise<{ id: string; jobId: string; organizationId: string | null; attemptNumber: number; status: 'PROCESSING' | 'COMPLETED' | 'FAILED'; startedAt: Date; finishedAt: Date | null; durationMs: number | null; errorMessage: string | null }>;

  finishAttempt(
    attemptId: string,
    values: { status: 'PROCESSING' | 'COMPLETED' | 'FAILED'; errorMessage?: string | null },
    executor?: DatabaseExecutor,
  ): Promise<{ id: string; jobId: string; organizationId: string | null; attemptNumber: number; status: 'PROCESSING' | 'COMPLETED' | 'FAILED'; startedAt: Date; finishedAt: Date | null; durationMs: number | null; errorMessage: string | null } | null>;

  recordEvent(
    values: {
      jobId: string;
      organizationId: string | null;
      attemptId?: string | null;
      type: string;
      message?: string | null;
      metadata?: JsonObject | null;
    },
    executor?: DatabaseExecutor,
  ): Promise<{ id: string; jobId: string; organizationId: string | null; attemptId: string | null; type: string; message: string | null; metadata: JsonObject | null; createdAt: Date }>;

  listEvents(
    params: { jobId: string; page: number; limit: number },
    executor?: DatabaseExecutor,
  ): Promise<{ rows: { id: string; jobId: string; organizationId: string | null; attemptId: string | null; type: string; message: string | null; metadata: JsonObject | null; createdAt: Date }[]; total: number }>;

  addDependency(
    values: {
      jobId: string;
      organizationId: string | null;
      dependsOnJobId: string;
    },
    executor?: DatabaseExecutor,
  ): Promise<{ id: string; jobId: string; organizationId: string | null; dependsOnJobId: string; createdAt: Date }>;

  listDependencies(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<{ id: string; dependsOnJobId: string; dependsOnJobStatus: string | null; createdAt: Date }[]>;

  wouldCreateCycle(jobId: string, depJobId: string, executor?: DatabaseExecutor): Promise<boolean>;

  hasIncompleteDependencies(jobId: string, executor?: DatabaseExecutor): Promise<boolean>;

  getStatusCounts(
    filters: { from?: string; to?: string },
    executor?: DatabaseExecutor,
  ): Promise<{ status: string; total: string | number }[]>;

  getTypeCounts(
    filters: { from?: string; to?: string },
    executor?: DatabaseExecutor,
  ): Promise<{ type: string; total: string | number }[]>;

  getRetryCounts(
    filters: { from?: string; to?: string },
    executor?: DatabaseExecutor,
  ): Promise<{ retried: number; terminal: number }>;

  getAverageDurationMs(
    filters: { from?: string; to?: string },
    executor?: DatabaseExecutor,
  ): Promise<number | null>;
}

export const JOB_OBSERVABILITY_REPOSITORY = Symbol('JOB_OBSERVABILITY_REPOSITORY');
