import type { ExportJobsRepository } from '../infrastructure/export-jobs.repository';

type ExportJobRecord = NonNullable<
  Awaited<ReturnType<ExportJobsRepository['findById']>>
>;

export class ExportsMapper {
  static toDto(job: ExportJobRecord) {
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      fileId: job.fileId ?? null,
      filters: job.filters ?? null,
      createdById: job.createdById,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
