import type { DatabaseExecutor } from '@repo/api-database';

export interface IdempotentInsertResult<T> {
  value: T;
  created: boolean;
}

export interface ExportJobRecord {
  id: string;
  type: string;
  status: string;
  filters: Record<string, unknown> | null;
  fileId: string | null;
  organizationId: string | null;
  createdById: string;
  idempotencyKey: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportJobsRepositoryPort {
  create(
    values: Record<string, unknown>,
    executor?: DatabaseExecutor,
  ): Promise<ExportJobRecord | null>;

  createIdempotent(
    values: Record<string, unknown> & { createdById: string; idempotencyKey: string },
    executor?: DatabaseExecutor,
  ): Promise<IdempotentInsertResult<ExportJobRecord> | null>;

  findById(jobId: string, executor?: DatabaseExecutor): Promise<ExportJobRecord | null>;

  findByIdempotencyKey(
    createdById: string,
    idempotencyKey: string,
    executor?: DatabaseExecutor,
  ): Promise<ExportJobRecord | null>;

  update(
    jobId: string,
    values: Partial<Record<string, unknown>>,
    executor?: DatabaseExecutor,
  ): Promise<ExportJobRecord | null>;
}

export const EXPORT_JOBS_REPOSITORY = Symbol('EXPORT_JOBS_REPOSITORY');
