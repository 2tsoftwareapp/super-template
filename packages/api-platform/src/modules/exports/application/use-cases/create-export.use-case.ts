import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { ImportExportAdapterRegistry, requireOrganizationId } from '@repo/api-core';
import { randomUUID } from 'node:crypto';

import type { CreateExportCommand } from '../exports.types';

import { AuditService } from '../../../audit/application/audit.service';
import { FilesRepository } from '../../../files/infrastructure/files.repository';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../storage/application/object-storage.interface';
import { ExportJobsRepository } from '../../infrastructure/export-jobs.repository';
import { ExportsMapper } from '../exports.mapper';

@Injectable()
export class CreateExportUseCase {
  constructor(
    private readonly exportJobsRepository: ExportJobsRepository,
    private readonly filesRepository: FilesRepository,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
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

    try {
      const fileId = await this.generateExportFile(actor, organizationId, input);

      const updated = await this.exportJobsRepository.update(job.id, {
        status: 'COMPLETED',
        fileId,
        completedAt: new Date(),
      });

      await this.auditService.log({
        actorId: actor.userId,
        action: 'export.created',
        entityType: 'export_job',
        entityId: job.id,
        metadata: { type: input.type, fileId },
        requestContext,
      });

      return ExportsMapper.toDto(updated ?? job);
    } catch (error) {
      await this.exportJobsRepository.update(job.id, {
        status: 'FAILED',
        completedAt: new Date(),
      });

      throw error;
    }
  }

  private async generateExportFile(
    actor: AuthenticatedRequestUser,
    organizationId: string,
    input: CreateExportCommand,
  ) {
    const adapter = this.importExportAdapters.resolve(input.type);
    const rows = await adapter.listForExport({
      organizationId,
      ownerId: actor.userId,
    });

    const lines = [
      adapter.csvHeader.join(','),
      ...rows.map((row) =>
        adapter
          .toCsvRow(row)
          .map((value) => this.escapeCsv(value))
          .join(','),
      ),
    ];

    const storageKey = `exports/${actor.userId}/${randomUUID()}.csv`;
    const body = Buffer.from(lines.join('\n'), 'utf8');

    await this.objectStorage.upload({
      key: storageKey,
      body,
      mimeType: 'text/csv',
    });

    try {
      const file = await this.filesRepository.create({
        organizationId,
        storageKey,
        originalName: `${input.type}-export-${Date.now()}.csv`,
        mimeType: 'text/csv',
        sizeBytes: body.length,
        uploadedById: actor.userId,
      });

      if (!file) {
        throw new Error('Export file insert returned no rows');
      }

      return file.id;
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  private escapeCsv(value: string) {
    // Neutralize formula injection: spreadsheet apps execute cells starting with these characters.
    const sanitized = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;

    if (
      sanitized.includes(',') ||
      sanitized.includes('"') ||
      sanitized.includes('\n')
    ) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }

    return sanitized;
  }
}
