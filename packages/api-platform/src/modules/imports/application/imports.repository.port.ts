import type { DatabaseExecutor } from '@repo/api-database';

export interface ImportJobRecord {
  id: string;
  type: string;
  fileId: string;
  status: string;
  rowCount: number | null;
  successCount: number | null;
  errorCount: number | null;
  errors: unknown[] | null;
  organizationId: string | null;
  createdById: string;
  confirmedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportJobsRepositoryPort {
  create(
    values: Record<string, unknown>,
    executor?: DatabaseExecutor,
  ): Promise<ImportJobRecord | null>;
  createIdempotent(
    values: Record<string, unknown> & { createdById: string; idempotencyKey: string },
    executor?: DatabaseExecutor,
  ): Promise<{ value: ImportJobRecord | undefined; created: boolean }>;
  findById(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<ImportJobRecord | null>;
  update(
    jobId: string,
    values: Record<string, unknown>,
    executor?: DatabaseExecutor,
  ): Promise<ImportJobRecord | null>;
}

export const IMPORT_JOBS_REPOSITORY = Symbol('IMPORT_JOBS_REPOSITORY');
