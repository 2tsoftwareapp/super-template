import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  type AuthenticatedRequestUser,
  ERROR_CODES,
  type ImportValidationError,
  type RequestContext,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
  type TransactionPort,
} from '@repo/api-core';
import { ImportExportAdapterRegistry } from '@repo/api-platform';

import type { CreateImportCommand, ImportJobView } from '../imports.types';

import { AuditService } from '../../../audit/application/audit.service';
import { FileAccessService } from '../../../files/application/services/file-access.service';
import { MAX_IMPORT_ROWS } from '../../domain/import-types';
import {
  IMPORT_JOBS_REPOSITORY,
  type ImportJobsRepositoryPort,
} from '../ports/imports.repository.port';
import { ImportFileParserService } from '../services/import-file-parser.service';
import { GetImportUseCase } from './get-import.use-case';

@Injectable()
export class CreateImportUseCase {
  constructor(
    @Inject(IMPORT_JOBS_REPOSITORY)
    private readonly importJobsRepository: ImportJobsRepositoryPort,
    private readonly fileAccessService: FileAccessService,
    private readonly importFileParser: ImportFileParserService,
    private readonly auditService: AuditService,
    private readonly getImportUseCase: GetImportUseCase,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateImportCommand,
    requestContext?: RequestContext,
  ): Promise<ImportJobView> {
    const file = await this.fileAccessService.findAccessibleFile(
      actor,
      input.fileId,
    );

    if (!file.organizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Cannot import a global file',
        HttpStatus.BAD_REQUEST,
      );
    }

    const organizationId = file.organizationId;

    // Resolve adapter before creating any DB records
    this.importExportAdapters.resolve(input.type);

    const importPermissions = this.importExportAdapters.getImportPermissions(input.type);
    for (const permission of importPermissions) {
      if (!actor.permissions.includes(permission)) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          `Missing required permission: ${permission}`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const jobValues = {
      organizationId,
      type: input.type,
      fileId: input.fileId,
      status: 'PENDING' as const,
      createdById: actor.userId,
    };

    const { job, created } = await this.transactionPort.withTenant(
      { tenantId: organizationId, userId: actor.userId },
      async (tx) => {
        const idempotentResult = input.idempotencyKey
          ? await this.importJobsRepository.createIdempotent(
              {
                ...jobValues,
                idempotencyKey: input.idempotencyKey,
              },
              tx,
            )
          : null;

        const jobRecord = idempotentResult
          ? idempotentResult.value
          : await this.importJobsRepository.create(jobValues, tx);

        if (!jobRecord) {
          throw new Error('Import job insert returned no rows');
        }

        const isCreated = idempotentResult ? idempotentResult.created : true;

        if (isCreated) {
          await this.auditService.log(
            {
              actorId: actor.userId,
              action: 'import.created',
              entityType: 'import_job',
              entityId: jobRecord.id,
              metadata: { type: input.type, fileId: input.fileId },
              requestContext,
              scope: SYSTEM_SCOPE.ORGANIZATION,
              organizationId,
            },
            tx,
          );
        }

        return { job: jobRecord, created: isCreated };
      },
    );

    if (!created) {
      return this.getImportUseCase.execute(actor, job.id);
    }

    const parsed = await this.importFileParser.parseImportFile(
      input.type,
      file.storageKey,
    );

    if (parsed.rows.length > MAX_IMPORT_ROWS) {
      const tooManyRowsError: ImportValidationError = {
        row: 0,
        message: `Import exceeds the maximum of ${MAX_IMPORT_ROWS} rows`,
      };
      await this.importJobsRepository.update(job.id, {
        status: 'FAILED',
        rowCount: parsed.rows.length,
        successCount: 0,
        errorCount: 1,
        errors: [tooManyRowsError],
      });
      return this.getImportUseCase.execute(actor, job.id);
    }

    const errors = this.importFileParser.validateRows(input.type, parsed.rows);

    await this.importJobsRepository.update(job.id, {
      status: errors.length > 0 ? 'FAILED' : 'PROCESSING',
      rowCount: parsed.rows.length,
      successCount: errors.length > 0 ? 0 : parsed.rows.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : null,
    });

    return this.getImportUseCase.execute(actor, job.id);
  }
}
