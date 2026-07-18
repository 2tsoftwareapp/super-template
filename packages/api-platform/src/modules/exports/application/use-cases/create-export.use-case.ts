import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import {  ImportExportAdapterRegistry, requireOrganizationId, toCsv , SYSTEM_SCOPE, TRANSACTION_PORT, type TransactionPort } from '@repo/api-core';
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
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateExportCommand,
    requestContext?: RequestContext,
  ) {
    const organizationId = requireOrganizationId(actor);

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

    const adapter = this.importExportAdapters.resolve(input.type);
    const rows = await adapter.listForExport({
      organizationId,
      ownerId: actor.userId,
    });

    const csv = toCsv(adapter.csvHeader, rows.map((row) => adapter.toCsvRow(row)));
    const storageKey = `exports/${actor.userId}/${randomUUID()}.csv`;
    const body = Buffer.from(csv, 'utf8');

    await this.objectStorage.upload({
      key: storageKey,
      body,
      mimeType: 'text/csv',
    });

    try {
      const updatedJob = await this.transactionPort.run(async (tx) => {
        const file = await this.filesRepository.create({
          organizationId,
          storageKey,
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

        return updated;
      });

      return ExportsMapper.toDto(updatedJob ?? job);
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      await this.exportJobsRepository.update(job.id, {
        status: 'FAILED',
        completedAt: new Date(),
      }).catch(() => undefined);

      throw error;
    }
  }


}
