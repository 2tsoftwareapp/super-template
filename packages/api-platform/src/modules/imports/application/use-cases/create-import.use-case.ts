import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  AppError, ERROR_CODES , SYSTEM_SCOPE, TRANSACTION_PORT, type TransactionPort } from '@repo/api-core';

import type { CreateImportCommand, ImportJobView } from '../imports.types';

import { AuditService } from '../../../audit/application/audit.service';
import { FILES_REPOSITORY, type FilesRepositoryPort } from '../../../files/application/ports/files.repository.port';
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
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    private readonly importFileParser: ImportFileParserService,
    private readonly auditService: AuditService,
    private readonly getImportUseCase: GetImportUseCase,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateImportCommand,
    requestContext?: RequestContext,
  ): Promise<ImportJobView> {
    const file = await this.filesRepository.findById(input.fileId);

    if (!file) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        'Import file not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (!file.organizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Cannot import a global file',
        HttpStatus.BAD_REQUEST,
      );
    }

    const jobValues = {
      organizationId: file.organizationId,
      type: input.type,
      fileId: input.fileId,
      status: 'PENDING' as const,
      createdById: actor.userId,
    };

    const { job, created } = (await this.transactionPort.withTenant(
      { tenantId: file.organizationId, userId: actor.userId },
      async (tx) => {
        const idempotentResult = input.idempotencyKey
          ? await this.importJobsRepository.createIdempotent({
              ...jobValues,
              idempotencyKey: input.idempotencyKey,
            }, tx)
          : null;

        const jobRecord = idempotentResult
          ? idempotentResult.value
          : await this.importJobsRepository.create(jobValues, tx);

        if (!jobRecord) {
          throw new Error('Import job insert returned no rows');
        }

        const isCreated = idempotentResult ? idempotentResult.created : true;

        if (isCreated) {
          await this.auditService.log({
            actorId: actor.userId,
            action: 'import.created',
            entityType: 'import_job',
            entityId: jobRecord.id,
            metadata: { type: input.type, fileId: input.fileId },
            requestContext,
            scope: SYSTEM_SCOPE.ORGANIZATION,
            organizationId: file.organizationId!,
          }, tx);
        }

        return { job: jobRecord, created: isCreated };
      }
    )) as any;

    if (!created) {
      return this.getImportUseCase.execute(actor, job.id);
    }

    const parsed = await this.importFileParser.parseImportFile(
      input.type,
      file.storageKey,
    );
    const errors = this.importFileParser.validateRows(
      input.type,
      parsed.rows,
    );

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
