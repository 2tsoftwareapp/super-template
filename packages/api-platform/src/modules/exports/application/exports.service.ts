import { randomUUID } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core/common/constants/error-codes';
import { AppError } from '@repo/api-core/common/errors/app-error';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core/common/types/request-context';
import { requireOrganizationId } from '@repo/api-core/common/utils/require-organization';
import { AuditService } from '../../audit/application/audit.service';
import { FilesRepository } from '../../files/infrastructure/files.repository';
import { ProjectsRepository } from '@repo/api-workspace/modules/projects/infrastructure/projects.repository';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../storage/application/object-storage.interface';
import { ExportJobsRepository } from '../infrastructure/export-jobs.repository';
import type { CreateExportDto } from '../presentation/exports.dto';

@Injectable()
export class ExportsService {
  constructor(
    private readonly exportJobsRepository: ExportJobsRepository,
    private readonly filesRepository: FilesRepository,
    private readonly projectsRepository: ProjectsRepository,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
  ) {}

  async create(
    actor: AuthenticatedRequestUser,
    input: CreateExportDto,
    requestContext?: RequestContext,
  ) {
    const organizationId = requireOrganizationId(actor);
    const job = await this.exportJobsRepository.create({
      organizationId,
      type: input.type,
      status: 'PROCESSING',
      filters: input.filters ?? null,
      createdById: actor.userId,
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

    if (!job || job.createdById !== actor.userId) {
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

    const result = await this.projectsRepository.list({
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
