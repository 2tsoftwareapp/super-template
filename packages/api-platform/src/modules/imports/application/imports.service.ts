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

import type { CreateImportDto } from '../presentation/imports.dto';

import { AuditService } from '../../audit/application/audit.service';
import { FilesRepository } from '../../files/infrastructure/files.repository';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../storage/application/object-storage.interface';
import { ImportJobsRepository } from '../infrastructure/import-jobs.repository';

interface ParsedProjectRow {
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly importJobsRepository: ImportJobsRepository,
    private readonly filesRepository: FilesRepository,
    @Inject(PROJECT_DEMO_GATEWAY)
    private readonly projectDemoGateway: ProjectDemoGateway,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
  ) {}

  async create(
    actor: AuthenticatedRequestUser,
    input: CreateImportDto,
    requestContext?: RequestContext,
  ) {
    const file = await this.filesRepository.findById(input.fileId);

    if (!file) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        'Import file not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (input.idempotencyKey) {
      const existing = await this.importJobsRepository.findByIdempotencyKey(
        actor.userId,
        input.idempotencyKey,
      );

      if (existing) {
        return this.toDto(existing);
      }
    }

    const job = await this.importJobsRepository.create({
      organizationId: file.organizationId,
      type: input.type,
      fileId: input.fileId,
      status: 'PENDING',
      createdById: actor.userId,
      ...(input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey }
        : {}),
    });

    if (!job) {
      throw new Error('Import job insert returned no rows');
    }

    const parsed = await this.parseImportFile(input.type, file.storageKey);
    const errors = this.validateProjectRows(parsed.rows);

    await this.importJobsRepository.update(job.id, {
      status: errors.length > 0 ? 'FAILED' : 'PROCESSING',
      rowCount: parsed.rows.length,
      successCount: errors.length > 0 ? 0 : parsed.rows.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : null,
    });

    await this.auditService.log({
      actorId: actor.userId,
      action: 'import.created',
      entityType: 'import_job',
      entityId: job.id,
      metadata: { type: input.type, fileId: input.fileId },
      requestContext,
    });

    return this.getById(actor, job.id);
  }

  async getById(actor: AuthenticatedRequestUser, jobId: string) {
    const job = await this.importJobsRepository.findById(jobId);

    if (job?.createdById !== actor.userId) {
      throw new AppError(
        ERROR_CODES.IMPORT_JOB_NOT_FOUND,
        'Import job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toDto(job);
  }

  async confirm(
    actor: AuthenticatedRequestUser,
    jobId: string,
    requestContext?: RequestContext,
  ) {
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

    const parsed = await this.parseImportFile(job.type, file.storageKey);
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

    return this.toDto(updated ?? job);
  }

  private async parseImportFile(type: string, storageKey: string) {
    if (type !== 'projects') {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Unsupported import type "${type}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const content = await this.objectStorage.read(storageKey);
    const lines = content
      .toString('utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return { rows: [] as ParsedProjectRow[] };
    }

    const [headerLine, ...dataLines] = lines;
    const headers = headerLine?.split(',').map((value) => value.trim()) ?? [];

    const rows = dataLines.map((line) => {
      const values = line.split(',').map((value) => value.trim());
      const record = Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? '']),
      );

      return {
        name: record.name ?? '',
        description: record.description ?? null,
        status: (record.status ?? 'DRAFT') as ParsedProjectRow['status'],
      };
    });

    return { rows };
  }

  private validateProjectRows(rows: ParsedProjectRow[]) {
    const errors: Record<string, unknown>[] = [];

    rows.forEach((row, index) => {
      if (!row.name) {
        errors.push({ row: index + 1, message: 'name is required' });
      }

      if (!['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(row.status)) {
        errors.push({ row: index + 1, message: 'status is invalid' });
      }
    });

    return errors;
  }

  private toDto(
    job: NonNullable<Awaited<ReturnType<ImportJobsRepository['findById']>>>,
  ) {
    return {
      id: job.id,
      type: job.type,
      fileId: job.fileId,
      status: job.status,
      rowCount: job.rowCount ?? null,
      successCount: job.successCount ?? null,
      errorCount: job.errorCount ?? null,
      errors: job.errors ?? null,
      createdById: job.createdById,
      confirmedAt: job.confirmedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
