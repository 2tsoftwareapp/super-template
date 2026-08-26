import type { JsonObject } from "@repo/api-runtime";
import type { TransactionExecutor } from "@repo/api-runtime";

export interface JobObservabilityRepositoryPort {
  startAttempt(
    values: {
      jobId: string;
      organizationId: string | null;
      attemptNumber: number;
    },
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    jobId: string;
    organizationId: string | null;
    attemptNumber: number;
    status: "PROCESSING" | "COMPLETED" | "FAILED";
    startedAt: Date;
    finishedAt: Date | null;
    durationMs: number | null;
    errorMessage: string | null;
  }>;

  finishAttempt(
    attemptId: string,
    values: { status: "PROCESSING" | "COMPLETED" | "FAILED"; errorMessage?: string | null },
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    jobId: string;
    organizationId: string | null;
    attemptNumber: number;
    status: "PROCESSING" | "COMPLETED" | "FAILED";
    startedAt: Date;
    finishedAt: Date | null;
    durationMs: number | null;
    errorMessage: string | null;
  } | null>;

  recordEvent(
    values: {
      jobId: string;
      organizationId: string | null;
      attemptId?: string | null;
      type: string;
      message?: string | null;
      metadata?: JsonObject | null;
    },
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    jobId: string;
    organizationId: string | null;
    attemptId: string | null;
    type: string;
    message: string | null;
    metadata: JsonObject | null;
    createdAt: Date;
  }>;

  listEvents(
    params: { jobId: string; page: number; limit: number },
    executor?: TransactionExecutor,
  ): Promise<{
    rows: {
      id: string;
      jobId: string;
      organizationId: string | null;
      attemptId: string | null;
      type: string;
      message: string | null;
      metadata: JsonObject | null;
      createdAt: Date;
    }[];
    total: number;
  }>;

  addDependency(
    values: {
      jobId: string;
      organizationId: string | null;
      dependsOnJobId: string;
    },
    executor?: TransactionExecutor,
  ): Promise<{
    id: string;
    jobId: string;
    organizationId: string | null;
    dependsOnJobId: string;
    createdAt: Date;
  }>;

  listDependencies(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<
    { id: string; dependsOnJobId: string; dependsOnJobStatus: string | null; createdAt: Date }[]
  >;

  wouldCreateCycle(
    jobId: string,
    depJobId: string,
    executor?: TransactionExecutor,
  ): Promise<boolean>;

  hasIncompleteDependencies(jobId: string, executor?: TransactionExecutor): Promise<boolean>;

  getStatusCounts(
    scope: { type: "organization"; organizationId: string } | { type: "platform" },
    filters: { from?: string; to?: string },
    executor?: TransactionExecutor,
  ): Promise<{ status: string; total: string | number }[]>;

  getTypeCounts(
    scope: { type: "organization"; organizationId: string } | { type: "platform" },
    filters: { from?: string; to?: string },
    executor?: TransactionExecutor,
  ): Promise<{ type: string; total: string | number }[]>;

  getRetryCounts(
    scope: { type: "organization"; organizationId: string } | { type: "platform" },
    filters: { from?: string; to?: string },
    executor?: TransactionExecutor,
  ): Promise<{ retried: number; terminal: number }>;

  getAverageDurationMs(
    scope: { type: "organization"; organizationId: string } | { type: "platform" },
    filters: { from?: string; to?: string },
    executor?: TransactionExecutor,
  ): Promise<number | null>;
}

export const JOB_OBSERVABILITY_REPOSITORY = Symbol("JOB_OBSERVABILITY_REPOSITORY");
