import type { ImportJobRecord } from './imports.repository.port';
import type { ImportJobView } from './imports.types';

export class ImportsMapper {
  toImportJobView(job: ImportJobRecord): ImportJobView {
    return {
      id: job.id,
      type: job.type,
      fileId: job.fileId,
      status: job.status,
      rowCount: job.rowCount ?? null,
      successCount: job.successCount ?? null,
      errorCount: job.errorCount ?? null,
      errors: job.errors ?? null,
      createdById: job.createdById,
      confirmedAt: job.confirmedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
