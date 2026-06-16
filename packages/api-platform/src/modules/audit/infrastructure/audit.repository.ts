import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { DATABASE } from '@repo/api-database/database.provider';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database/database.types';
import { auditLogs } from '@repo/api-database/schema';

type ListAuditLogsParams = {
  page: number;
  limit: number;
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  sortOrder: 'asc' | 'desc';
};

@Injectable()
export class AuditRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async list(
    params: ListAuditLogsParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters: SQL[] = [];

    if (params.actorId) {
      filters.push(eq(auditLogs.actorId, params.actorId));
    }

    if (params.action) {
      filters.push(eq(auditLogs.action, params.action));
    }

    if (params.resourceType) {
      filters.push(eq(auditLogs.entityType, params.resourceType));
    }

    if (params.resourceId) {
      filters.push(eq(auditLogs.entityId, params.resourceId));
    }

    if (params.from) {
      filters.push(gte(auditLogs.createdAt, new Date(params.from)));
    }

    if (params.to) {
      filters.push(lte(auditLogs.createdAt, new Date(params.to)));
    }

    const whereClause = filters.length ? and(...filters) : undefined;
    const orderBy =
      params.sortOrder === 'asc'
        ? auditLogs.createdAt
        : desc(auditLogs.createdAt);
    const offset = (params.page - 1) * params.limit;

    const [rows, totalResult] = await Promise.all([
      executor
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(auditLogs).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totalResult[0]?.total ?? 0),
    };
  }

  async create(
    values: typeof auditLogs.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ): Promise<typeof auditLogs.$inferSelect> {
    const [auditLog] = await executor
      .insert(auditLogs)
      .values(values)
      .returning();

    if (!auditLog) {
      throw new Error('Audit log insert returned no rows');
    }

    return auditLog;
  }
}
