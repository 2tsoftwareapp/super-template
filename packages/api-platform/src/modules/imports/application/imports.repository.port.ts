import type { DatabaseExecutor } from '@repo/api-database';

import type { ImportJobsRepository } from '../infrastructure/import-jobs.repository';

export type ImportJobRecord = NonNullable<
  Awaited<ReturnType<ImportJobsRepository['findById']>>
>;

export interface ImportJobsRepositoryPort {
  create(
    values: Parameters<ImportJobsRepository['create']>[0],
    executor?: DatabaseExecutor,
  ): Promise<ImportJobRecord | null>;
  createIdempotent(
    values: Parameters<ImportJobsRepository['createIdempotent']>[0],
    executor?: DatabaseExecutor,
  ): ReturnType<ImportJobsRepository['createIdempotent']>;
  findById(
    jobId: string,
    executor?: DatabaseExecutor,
  ): Promise<ImportJobRecord | null>;
  update(
    jobId: string,
    values: Parameters<ImportJobsRepository['update']>[1],
    executor?: DatabaseExecutor,
  ): Promise<ImportJobRecord | null>;
}

export const IMPORT_JOBS_REPOSITORY = Symbol('IMPORT_JOBS_REPOSITORY');
