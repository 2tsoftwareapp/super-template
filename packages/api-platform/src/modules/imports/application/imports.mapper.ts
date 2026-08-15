import { Injectable } from '@nestjs/common';

import type { ImportJobStatus, ImportJobView } from './imports.types';
import type { ImportJobRecord } from './ports/imports.repository.port';

@Injectable()
export class ImportsMapper {
  toImportJobView(job: ImportJobRecord): ImportJobView {
    return {
      id: job.id,
      type: job.type,
      fileId: job.fileId,
      status: job.status as ImportJobStatus,
      rowCount: job.rowCount ?? null,
      successCount: job.successCount ?? null,
      errorCount: job.errorCount ?? null,
      errors: job.errors,
      createdById: job.createdById,
      confirmedAt: job.confirmedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
