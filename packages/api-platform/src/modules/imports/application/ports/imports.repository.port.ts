import type { ImportValidationError, TransactionExecutor } from '@repo/api-core';

export interface ImportJobRecord {
  id: string;
  type: string;
  fileId: string;
  status: string;
  rowCount: number | null;
  successCount: number | null;
  errorCount: number | null;
  errors: ImportValidationError[] | null;
  organizationId: string;
  createdById: string;
  confirmedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateImportJobValues {
  organizationId: string;
  type: string;
  fileId: string;
  status: 'PENDING';
  createdById: string;
  idempotencyKey?: string;
}

export type ImportJobStatusValue =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface UpdateImportJobValues {
  status?: ImportJobStatusValue;
  rowCount?: number | null;
  successCount?: number | null;
  errorCount?: number | null;
  errors?: ImportValidationError[] | null;
  confirmedAt?: Date | null;
  completedAt?: Date | null;
}

export interface ImportJobsRepositoryPort {
  create(
    values: CreateImportJobValues,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null>;
  createIdempotent(
    values: CreateImportJobValues & { idempotencyKey: string },
    executor?: TransactionExecutor,
  ): Promise<{ value: ImportJobRecord | undefined; created: boolean }>;
  findById(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null>;
  /**
   * Atomically claims an import job for confirmation: only succeeds while
   * `confirmed_at` is still NULL, so concurrent confirm requests cannot both
   * import the same rows. Returns the claimed row or null when already
   * confirmed (caller must treat null as a conflict).
   */
  confirm(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null>;
  update(
    jobId: string,
    values: UpdateImportJobValues,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null>;
}

export const IMPORT_JOBS_REPOSITORY = Symbol('IMPORT_JOBS_REPOSITORY');
