import type {
  ImportExportAdapter,
  ImportExportRowContext,
} from '@repo/api-core';

import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ImportExportAdapterRegistry } from '@repo/api-core';

import { ProjectsRepository } from '../infrastructure/projects.repository';

export interface ProjectImportExportRow {
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

const PROJECT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;

@Injectable()
export class ProjectsImportExportAdapter
  implements ImportExportAdapter<ProjectImportExportRow>, OnModuleInit
{
  readonly type = 'projects';
  readonly csvHeader = ['name', 'description', 'status'];

  constructor(
    private readonly registry: ImportExportAdapterRegistry,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async listForExport(params: {
    organizationId: string;
    ownerId: string;
  }): Promise<ProjectImportExportRow[]> {
    const result = await this.projectsRepository.list({
      page: 1,
      limit: 1000,
      ownerId: params.ownerId,
      organizationId: params.organizationId,
      sortField: 'updatedAt',
      sortOrder: 'desc',
    });

    return result.rows.map((project) => ({
      name: project.name,
      description: project.description,
      status: project.status,
    }));
  }

  toCsvRow(row: ProjectImportExportRow): string[] {
    return [row.name, row.description ?? '', row.status];
  }

  parseCsvRecord(record: Record<string, string>): ProjectImportExportRow {
    const rawStatus = record.status ?? 'DRAFT';
    const status = PROJECT_STATUSES.find((value) => value === rawStatus) ?? 'DRAFT';

    return {
      name: record.name ?? '',
      description: record.description ?? null,
      status,
    };
  }

  validateRow(row: ProjectImportExportRow): string | null {
    if (!row.name) {
      return 'name is required';
    }

    if (!PROJECT_STATUSES.includes(row.status)) {
      return 'status is invalid';
    }

    return null;
  }

  async importRow(
    row: ProjectImportExportRow,
    context: ImportExportRowContext,
  ): Promise<void> {
    const existing = await this.projectsRepository.findActiveByOwnerAndName(
      context.ownerId,
      row.name,
    );

    if (existing) {
      throw new Error('A project with this name already exists');
    }

    await this.projectsRepository.create({
      organizationId: context.organizationId,
      ownerId: context.ownerId,
      name: row.name,
      description: row.description ?? '',
      status: row.status,
      createdById: context.createdById,
    });
  }
}
