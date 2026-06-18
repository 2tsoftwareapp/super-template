import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import type { ProjectsRepository } from '../infrastructure/projects.repository';

export type ProjectRecord = NonNullable<
  Awaited<ReturnType<ProjectsRepository['findById']>>
>;

export interface ProjectsListParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  sortField: 'createdAt' | 'name' | 'status' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  ownerId?: string;
  organizationId?: string;
  includeDeleted?: boolean;
}

export interface ProjectsListResult {
  rows: ProjectRecord[];
  total: number;
}

export interface ProjectsRepositoryPort {
  readonly client: DatabaseClient;

  findById(
    projectId: string,
    executor?: DatabaseExecutor,
    includeDeleted?: boolean,
  ): Promise<ProjectRecord | null>;
  findActiveByOwnerAndName(
    ownerId: string,
    name: string,
    executor?: DatabaseExecutor,
  ): Promise<ProjectRecord | null>;
  create(
    values: Parameters<ProjectsRepository['create']>[0],
    executor?: DatabaseExecutor,
  ): Promise<ProjectRecord | null>;
  update(
    projectId: string,
    values: Parameters<ProjectsRepository['update']>[1],
    executor?: DatabaseExecutor,
  ): Promise<ProjectRecord | null>;
  list(
    params: ProjectsListParams,
    executor?: DatabaseExecutor,
  ): Promise<ProjectsListResult>;
}

export const PROJECTS_REPOSITORY = Symbol('PROJECTS_REPOSITORY');
