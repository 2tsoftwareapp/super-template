import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ERROR_CODES,
  PROJECT_DEMO_GATEWAY,
  type ProjectDemoGateway,
} from '@repo/api-core';

import type { ImportJobView } from './imports.types';

import { AuditService } from '../../audit/application/audit.service';
import { FilesRepository } from '../../files/infrastructure/files.repository';
import { ImportProjectParserService } from './import-project-parser.service';
import { ImportsMapper } from './imports.mapper';
import {
  IMPORT_JOBS_REPOSITORY,
  type ImportJobsRepositoryPort,
} from './imports.repository.port';

@Injectable()
export class ConfirmImportUseCase {
  private readonly importsMapper = new ImportsMapper();

  constructor(
    @Inject(IMPORT_JOBS_REPOSITORY)
    private readonly importJobsRepository: ImportJobsRepositoryPort,
    private readonly filesRepository: FilesRepository,
    @Inject(PROJECT_DEMO_GATEWAY)
    private readonly projectDemoGateway: ProjectDemoGateway,
    private readonly importProjectParser: ImportProjectParserService,
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

    const parsed = await this.importProjectParser.parseImportFile(
      job.type,
      file.storageKey,
    );
    let successCount = 0;
    const errors: Record<string, unknown>[] = [];

    for (const [index, row] of parsed.rows.entries()) {
      try {
        if (job.type === 'projects') {
          const existing =
            await this.projectDemoGateway.findActiveByOwnerAndName(
              actor.userId,
              row.name,
            );

          if (existing) {
            throw new Error('A project with this name already exists');
          }

          await this.projectDemoGateway.create({
            organizationId: file.organizationId,
            ownerId: actor.userId,
            name: row.name,
            description: row.description ?? '',
            status: row.status,
            createdById: actor.userId,
          });
        }

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
