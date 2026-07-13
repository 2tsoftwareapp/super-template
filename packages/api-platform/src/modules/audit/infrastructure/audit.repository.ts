import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { auditLogs } from '@repo/api-database';
import { and, count, desc, eq, gte, ilike, lte, or, type SQL } from 'drizzle-orm';

import type { AuditRepositoryPort } from '../application/ports/audit.repository.port';

interface ListAuditLogsParams {
  page: number;
  limit: number;
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  /** Free-text match against action, entity type, and request ID. */
  q?: string;
  sortOrder: 'asc' | 'desc';
}

type AuditLogSearchParams = Pick<
  ListAuditLogsParams,
  'actorId' | 'action' | 'resourceType' | 'resourceId' | 'from' | 'to' | 'q'
>;

const buildAuditLogFilters = (params: AuditLogSearchParams): SQL[] => {
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

  if (params.q) {
    const pattern = `%${params.q}%`;
    const match = or(
      ilike(auditLogs.action, pattern),
      ilike(auditLogs.entityType, pattern),
      ilike(auditLogs.requestId, pattern),
    );

    if (match) {
      filters.push(match);
    }
  }

  return filters;
};

@Injectable()
export class AuditRepository implements AuditRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async list(
    params: ListAuditLogsParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = buildAuditLogFilters(params);
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

  /** Uncapped (up to `limit`) export query sharing the same filters as `list`. */
  async listForExport(
    params: AuditLogSearchParams & { limit: number },
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = buildAuditLogFilters(params);
    const whereClause = filters.length ? and(...filters) : undefined;

    return executor
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(params.limit);
  }

  /** Permanently deletes audit entries older than the cutoff; returns the count removed. */
  async deleteOlderThan(
    cutoff: Date,
    executor: DatabaseExecutor = this.database,
  ): Promise<number> {
    const deleted = await executor
      .delete(auditLogs)
      .where(lte(auditLogs.createdAt, cutoff))
      .returning({ id: auditLogs.id });

    return deleted.length;
  }

  async findById(
    id: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [row] = await executor
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);
    return row ?? null;
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
