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
  requireOrganizationId,
  SYSTEM_SCOPE,
  toCsv,
  TRANSACTION_PORT,
  type TransactionPort,
} from '@repo/api-core';
import { randomUUID } from 'node:crypto';

import type { CreateExportCommand } from '../exports.types';

import { AuditService } from '../../../audit/application/audit.service';
import { FILES_REPOSITORY, type FilesRepositoryPort } from '../../../files/application/ports/files.repository.port';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../storage/application/object-storage.interface';
import { ExportsMapper } from '../exports.mapper';
import { EXPORT_JOBS_REPOSITORY, type ExportJobsRepositoryPort } from '../ports/export-jobs.repository.port';

@Injectable()
export class CreateExportUseCase {
  constructor(
    @Inject(EXPORT_JOBS_REPOSITORY) private readonly exportJobsRepository: ExportJobsRepositoryPort,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateExportCommand,
    requestContext?: RequestContext,
  ) {
    const organizationId = requireOrganizationId(actor);

    // Resolve adapter before creating any DB records
    const adapter = this.importExportAdapters.resolve(input.type);

    const exportPermissions = this.importExportAdapters.getExportPermissions(input.type);
    for (const permission of exportPermissions) {
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
      status: 'PROCESSING' as const,
      filters: input.filters ?? null,
      createdById: actor.userId,
    };

    const idempotentResult = input.idempotencyKey
      ? await this.exportJobsRepository.createIdempotent({
          ...jobValues,
          idempotencyKey: input.idempotencyKey,
        })
      : null;

    const job = idempotentResult
      ? idempotentResult.value
      : await this.exportJobsRepository.create(jobValues);

    if (!job) {
      throw new Error('Export job insert returned no rows');
    }

    if (idempotentResult && !idempotentResult.created) {
      return ExportsMapper.toDto(job);
    }

    let storageKey: string | undefined;

    try {
      const rows = await adapter.listForExport({
        organizationId,
        ownerId: actor.userId,
      });

      const csv = toCsv(adapter.csvHeader, rows.map((row) => adapter.toCsvRow(row)));
      storageKey = `exports/${actor.userId}/${randomUUID()}.csv`;
      const body = Buffer.from(csv, 'utf8');

      await this.objectStorage.upload({
        key: storageKey,
        body,
        mimeType: 'text/csv',
      });

      const updatedJob = await this.transactionPort.run(async (tx) => {
        const file = await this.filesRepository.create({
          organizationId,
          storageKey: storageKey!,
          originalName: `${input.type}-export-${Date.now()}.csv`,
          mimeType: 'text/csv',
          sizeBytes: body.length,
          uploadedById: actor.userId,
        }, tx);

        if (!file) throw new Error('Export file insert returned no rows');

        const updated = await this.exportJobsRepository.update(job.id, {
          status: 'COMPLETED',
          fileId: file.id,
          completedAt: new Date(),
        }, tx);

        await this.auditService.log({
          actorId: actor.userId,
          action: 'export.created',
          entityType: 'export_job',
          entityId: job.id,
          metadata: { type: input.type, fileId: file.id },
          requestContext,
          ...(organizationId ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId } : { scope: SYSTEM_SCOPE.PLATFORM })
        }, tx);

        await this.activityEmitter.emit(
          {
            organizationId,
            summary: `Export "${input.type}" completed (${rows.length} rows)`,
            entityType: 'export_job',
            entityId: job.id,
            actorId: actor.userId,
            visibility: 'INTERNAL',
            metadata: { type: input.type, fileId: file.id, rowCount: rows.length },
          },
          tx,
        );

        return updated;
      });

      return ExportsMapper.toDto(updatedJob ?? job);
    } catch (error) {
      if (storageKey) {
        await this.objectStorage.delete(storageKey).catch((err) => {
          console.error(`Failed to cleanup orphaned export object ${storageKey}:`, err);
        });
      }
      
      await this.exportJobsRepository.update(job.id, {
        status: 'FAILED',
        completedAt: new Date(),
      }).catch((err) => {
        console.error(`Failed to mark export job ${job.id} as FAILED:`, err);
      });

      throw error;
    }
  }


}
