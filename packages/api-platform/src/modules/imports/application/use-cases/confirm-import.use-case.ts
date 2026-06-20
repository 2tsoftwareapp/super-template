import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ERROR_CODES,
  ImportExportAdapterRegistry,
  type ImportValidationError,
} from '@repo/api-core';

import type { ImportJobView } from '../imports.types';

import { AuditService } from '../../../audit/application/audit.service';
import { FilesRepository } from '../../../files/infrastructure/files.repository';
import { ImportsMapper } from '../imports.mapper';
import {
  IMPORT_JOBS_REPOSITORY,
  type ImportJobsRepositoryPort,
} from '../imports.repository.port';
import { ImportFileParserService } from '../services/import-file-parser.service';

@Injectable()
export class ConfirmImportUseCase {
  private readonly importsMapper = new ImportsMapper();

  constructor(
    @Inject(IMPORT_JOBS_REPOSITORY)
    private readonly importJobsRepository: ImportJobsRepositoryPort,
    private readonly filesRepository: FilesRepository,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
    private readonly importFileParser: ImportFileParserService,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    jobId: string,
    requestContext?: RequestContext,
  ): Promise<ImportJobView> {
    const job = await this.importJobsRepository.findById(jobId);

    if (job?.createdById !== actor.userId) {
      throw new AppError(
        ERROR_CODES.IMPORT_JOB_NOT_FOUND,
        'Import job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (job.confirmedAt) {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'Import job has already been confirmed',
        HttpStatus.CONFLICT,
      );
    }

    if (job.status === 'FAILED') {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'Import job cannot be confirmed because it failed validation',
        HttpStatus.CONFLICT,
      );
    }

    const file = await this.filesRepository.findById(job.fileId);

    if (!file) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        'Import file not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const parsed = await this.importFileParser.parseImportFile(
      job.type,
      file.storageKey,
    );
    const adapter = this.importExportAdapters.resolve(job.type);
    let successCount = 0;
    const errors: ImportValidationError[] = [];

    for (const [index, row] of parsed.rows.entries()) {
      try {
        await adapter.importRow(row, {
          organizationId: file.organizationId,
          ownerId: actor.userId,
          createdById: actor.userId,
        });

        successCount += 1;
      } catch (error) {
        errors.push({
          row: index + 1,
          message: error instanceof Error ? error.message : 'Import failed',
        });
      }
    }

    const updated = await this.importJobsRepository.update(job.id, {
      status: errors.length > 0 ? 'FAILED' : 'COMPLETED',
      confirmedAt: new Date(),
      completedAt: new Date(),
      successCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : null,
    });

    await this.auditService.log({
      actorId: actor.userId,
      action: 'import.confirmed',
      entityType: 'import_job',
      entityId: job.id,
      metadata: { successCount, errorCount: errors.length },
      requestContext,
    });

    return this.importsMapper.toImportJobView(updated ?? job);
  }
}
