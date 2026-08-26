import type { ExportJobRecord } from "./ports/export-jobs.repository.port";

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
