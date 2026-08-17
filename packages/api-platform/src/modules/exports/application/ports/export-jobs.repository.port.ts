import type { TransactionExecutor } from '@repo/api-core';

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
    executor?: TransactionExecutor,
  ): Promise<ExportJobRecord | null>;

  createIdempotent(
    values: Record<string, unknown> & { createdById: string; idempotencyKey: string },
    executor?: TransactionExecutor,
  ): Promise<IdempotentInsertResult<ExportJobRecord> | null>;

  findById(jobId: string, executor?: TransactionExecutor): Promise<ExportJobRecord | null>;

  findByIdempotencyKey(
    createdById: string,
    idempotencyKey: string,
    executor?: TransactionExecutor,
  ): Promise<ExportJobRecord | null>;

  /**
   * Atomically claims up to `limit` pending export jobs for processing.
   * Single UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED) so
   * concurrent workers each get distinct jobs and never double-claim.
   */
  claimPending(
    limit: number,
    executor?: TransactionExecutor,
  ): Promise<ExportJobRecord[]>;

  update(
    jobId: string,
    values: Partial<Record<string, unknown>>,
    executor?: TransactionExecutor,
  ): Promise<ExportJobRecord | null>;

  /**
   * Marks export jobs stuck in PROCESSING beyond `before` as FAILED (their
   * originating request died before completion). Returns the count recovered.
   */
  recoverStaleProcessing(
    before: Date,
    executor?: TransactionExecutor,
  ): Promise<number>;
}

export const EXPORT_JOBS_REPOSITORY = Symbol('EXPORT_JOBS_REPOSITORY');
