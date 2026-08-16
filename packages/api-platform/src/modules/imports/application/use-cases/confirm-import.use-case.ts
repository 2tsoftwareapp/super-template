import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  ACTIVITY_EMITTER,
  type ActivityEmitter,
  AppError,
  ERROR_CODES,
  ImportExportAdapterRegistry,
  type ImportValidationError,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
  type TransactionPort,
} from '@repo/api-core';

import type { ImportJobView } from '../imports.types';

import { AuditService } from '../../../audit/application/audit.service';
import { FileAccessService } from '../../../files/application/services/file-access.service';
import { canAccessImportJob } from '../../domain/import-access.policy';
import { ImportsMapper } from '../imports.mapper';
import {
  IMPORT_JOBS_REPOSITORY,
  type ImportJobsRepositoryPort,
} from '../ports/imports.repository.port';
import { ImportFileParserService } from '../services/import-file-parser.service';

@Injectable()
export class ConfirmImportUseCase {
  constructor(
    @Inject(IMPORT_JOBS_REPOSITORY)
    private readonly importJobsRepository: ImportJobsRepositoryPort,
    private readonly fileAccessService: FileAccessService,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
    private readonly importFileParser: ImportFileParserService,
    private readonly auditService: AuditService,
    private readonly importsMapper: ImportsMapper,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    jobId: string,
    requestContext?: RequestContext,
  ): Promise<ImportJobView> {
    const job = await this.importJobsRepository.findById(jobId);

    if (
      !job ||
      !canAccessImportJob({
        actor: {
          userId: actor.userId,
          organizationId: actor.organizationId,
          roles: actor.roles,
        },
        job: {
          createdById: job.createdById,
          organizationId: job.organizationId,
        },
      })
    ) {
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

    const file = await this.fileAccessService.findAccessibleFile(
      actor,
      job.fileId,
    );

    if (!file.organizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Global files cannot be imported into a tenant',
        HttpStatus.BAD_REQUEST,
      );
    }

    const organizationId = file.organizationId;
    const parsed = await this.importFileParser.parseImportFile(
      job.type,
      file.storageKey,
    );
    const adapter = this.importExportAdapters.resolve(job.type);

    const importPermissions = this.importExportAdapters.getImportPermissions(job.type);
    for (const permission of importPermissions) {
      if (!actor.permissions.includes(permission)) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          `Missing required permission: ${permission}`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    let successCount = 0;
    const errors: ImportValidationError[] = [];

    const updatedJob = await this.transactionPort.run(async (tx) => {
      // CAS claim before importing any rows: only the first confirm request
      // wins the `WHERE confirmed_at IS NULL` guard; a concurrent confirm
      // gets null here, throws, and its whole transaction (including the row
      // imports) rolls back - preventing double-import of the same data.
      const claimed = await this.importJobsRepository.confirm(job.id, tx);
      if (!claimed) {
        throw new AppError(
          ERROR_CODES.RESOURCE_CONFLICT,
          'Import job has already been confirmed',
          HttpStatus.CONFLICT,
        );
      }

      for (const [index, row] of parsed.rows.entries()) {
        const spName = `import_row_${index}`;
        try {
          await this.transactionPort.withSavepoint(tx, spName, async () => {
            await adapter.importRow(
              row,
              {
                organizationId,
                ownerId: actor.userId,
                createdById: actor.userId,
              },
              tx,
            );
          });
          successCount += 1;
        } catch (error) {
          errors.push({
            row: index + 1,
            message: error instanceof Error ? error.message : 'Import failed',
          });
        }
      }

      const updated = await this.importJobsRepository.update(
        job.id,
        {
          status: errors.length > 0 ? 'FAILED' : 'COMPLETED',
          completedAt: new Date(),
          successCount,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : null,
        },
        tx,
      );

      await this.auditService.log(
        {
          actorId: actor.userId,
          action: 'import.confirmed',
          entityType: 'import_job',
          entityId: job.id,
          metadata: { successCount, errorCount: errors.length },
          requestContext,
          scope: SYSTEM_SCOPE.ORGANIZATION,
          organizationId: job.organizationId,
        },
        tx,
      );

      await this.activityEmitter.emit(
        {
          organizationId: job.organizationId,
          summary: `Import "${job.type}" confirmed (${successCount} rows)`,
          entityType: 'import_job',
          entityId: job.id,
          actorId: actor.userId,
          visibility: 'INTERNAL',
          metadata: { successCount, errorCount: errors.length },
        },
        tx,
      );

      return updated;
    });

    return this.importsMapper.toImportJobView(updatedJob ?? job);
  }
}
