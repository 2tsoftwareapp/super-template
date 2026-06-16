import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { DATABASE } from '@repo/api-database';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';
import { projects } from '@repo/api-database';

type ListProjectsParams = {
  page: number;
  limit: number;
  search?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  sortField: 'createdAt' | 'name' | 'status' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  ownerId?: string;
  organizationId?: string;
  includeDeleted?: boolean;
};

const PROJECT_SORT_FIELDS = {
  createdAt: projects.createdAt,
  name: projects.name,
  status: projects.status,
  updatedAt: projects.updatedAt,
} as const;

@Injectable()
export class ProjectsRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  get client(): DatabaseClient {
    return this.database;
  }

  async create(
    values: typeof projects.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [project] = await executor
      .insert(projects)
      .values(values)
      .returning();
    return project ?? null;
  }

  async findById(
    projectId: string,
    executor: DatabaseExecutor = this.database,
    includeDeleted = false,
  ) {
    const filters = [eq(projects.id, projectId)];

    if (!includeDeleted) {
      filters.push(isNull(projects.deletedAt));
    }

    const [project] = await executor
      .select()
      .from(projects)
      .where(and(...filters))
      .limit(1);
    return project ?? null;
  }

  async update(
    projectId: string,
    values: Partial<typeof projects.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [project] = await executor
      .update(projects)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return project ?? null;
  }

  async list(
    params: ListProjectsParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = [];

    if (!params.includeDeleted) {
      filters.push(isNull(projects.deletedAt));
    }

    if (params.search) {
      const searchFilter = or(
        ilike(projects.name, `%${params.search}%`),
        ilike(projects.description, `%${params.search}%`),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    if (params.status) {
      filters.push(eq(projects.status, params.status));
    }

    if (params.ownerId) {
      filters.push(eq(projects.ownerId, params.ownerId));
    }

    if (params.organizationId) {
      filters.push(eq(projects.organizationId, params.organizationId));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;
    const sortColumn = PROJECT_SORT_FIELDS[params.sortField];

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(projects)
        .where(whereClause)
        .orderBy(
          params.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn),
        )
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(projects).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findActiveByOwnerAndName(
    ownerId: string,
    name: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [project] = await executor
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.ownerId, ownerId),
          eq(projects.name, name),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    return project ?? null;
  }
}
