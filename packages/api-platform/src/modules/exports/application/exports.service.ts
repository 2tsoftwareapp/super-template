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
  requireOrganizationId,
} from '@repo/api-core';
import { randomUUID } from 'node:crypto';

import type { CreateExportDto } from '../presentation/exports.dto';

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
    @Inject(PROJECT_DEMO_GATEWAY)
    private readonly projectDemoGateway: ProjectDemoGateway,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
  ) {}

  async create(
    actor: AuthenticatedRequestUser,
    input: CreateExportDto,
    requestContext?: RequestContext,
  ) {
    const organizationId = requireOrganizationId(actor);

    if (input.idempotencyKey) {
      const existing = await this.exportJobsRepository.findByIdempotencyKey(
        actor.userId,
        input.idempotencyKey,
      );

      if (existing) {
        return this.toDto(existing);
      }
    }

    const job = await this.exportJobsRepository.create({
      organizationId,
      type: input.type,
      status: 'PROCESSING',
      filters: input.filters ?? null,
      createdById: actor.userId,
      ...(input.idempotencyKey
        ? { idempotencyKey: input.idempotencyKey }
        : {}),
    });

    if (!job) {
      throw new Error('Export job insert returned no rows');
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
    input: CreateExportDto,
  ) {
    if (input.type !== 'projects') {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Unsupported export type "${input.type}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.projectDemoGateway.list({
      page: 1,
      limit: 1000,
      ownerId: actor.userId,
      organizationId,
      sortField: 'updatedAt',
      sortOrder: 'desc',
    });

    const lines = [
      'name,description,status',
      ...result.rows.map((project) =>
        [
          this.escapeCsv(project.name),
          this.escapeCsv(project.description ?? ''),
          project.status,
        ].join(','),
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
        originalName: `projects-export-${Date.now()}.csv`,
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
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
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
