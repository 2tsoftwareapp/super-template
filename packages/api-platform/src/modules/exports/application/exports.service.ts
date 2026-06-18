import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ERROR_CODES,
  ImportExportAdapterRegistry,
  requireOrganizationId,
} from '@repo/api-core';
import { randomUUID } from 'node:crypto';

import type { CreateExportCommand } from './exports.types';

import { AuditService } from '../../audit/application/audit.service';
import { FilesRepository } from '../../files/infrastructure/files.repository';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../storage/application/object-storage.interface';
import { ExportJobsRepository } from '../infrastructure/export-jobs.repository';

@Injectable()
export class ExportsService {
  constructor(
    private readonly exportJobsRepository: ExportJobsRepository,
    private readonly filesRepository: FilesRepository,
    private readonly importExportAdapters: ImportExportAdapterRegistry,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
  ) {}

  async create(
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
      return this.toDto(job);
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

      return this.toDto(updated ?? job);
    } catch (error) {
      await this.exportJobsRepository.update(job.id, {
        status: 'FAILED',
        completedAt: new Date(),
      });

      throw error;
    }
  }

  async getById(actor: AuthenticatedRequestUser, jobId: string) {
    const job = await this.exportJobsRepository.findById(jobId);

    if (job?.createdById !== actor.userId) {
      throw new AppError(
        ERROR_CODES.EXPORT_JOB_NOT_FOUND,
        'Export job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toDto(job);
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

  private toDto(
    job: NonNullable<Awaited<ReturnType<ExportJobsRepository['findById']>>>,
  ) {
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      fileId: job.fileId ?? null,
      filters: job.filters ?? null,
      createdById: job.createdById,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
