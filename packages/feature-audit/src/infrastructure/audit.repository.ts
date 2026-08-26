import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/database-runtime";
import { and, count, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";

import type { AuditRepositoryPort } from "../application/ports/audit.repository.port";

import { auditLogs } from "./persistence";

interface ListAuditLogsParams {
  page: number;
  limit: number;
  organizationId?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  /** Free-text match against action, entity type, and request ID. */
  q?: string;
  sortOrder: "asc" | "desc";
}

type AuditLogSearchParams = Pick<
  ListAuditLogsParams,
  "organizationId" | "actorId" | "action" | "resourceType" | "resourceId" | "from" | "to" | "q"
>;

const buildAuditLogFilters = (params: AuditLogSearchParams): SQL[] => {
  const filters: SQL[] = [];

  if (params.organizationId) {
    filters.push(eq(auditLogs.organizationId, params.organizationId));
  }

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
    const fromDate = new Date(params.from);
    fromDate.setUTCHours(0, 0, 0, 0);
    filters.push(gte(auditLogs.createdAt, fromDate));
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCDate(toDate.getUTCDate() + 1);
    filters.push(lt(auditLogs.createdAt, toDate));
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

  async list(params: ListAuditLogsParams, executor: DatabaseExecutor = this.database) {
    const filters = buildAuditLogFilters(params);
    const whereClause = filters.length ? and(...filters) : undefined;
    const orderBy = params.sortOrder === "asc" ? auditLogs.createdAt : desc(auditLogs.createdAt);
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

  async count(
    params: AuditLogSearchParams,
    executor: DatabaseExecutor = this.database,
  ): Promise<number> {
    const filters = buildAuditLogFilters(params);
    const whereClause = filters.length ? and(...filters) : undefined;
    const [result] = await executor.select({ total: count() }).from(auditLogs).where(whereClause);
    return Number(result?.total ?? 0);
  }

  async deleteOlderThanBatched(
    cutoff: Date,
    batchSize: number,
    executor: DatabaseExecutor = this.database,
  ): Promise<number> {
    const result = await executor.execute(
      sql`
        DELETE FROM l_audit_logs
        WHERE id IN (
          SELECT id FROM l_audit_logs
          WHERE created_at <= ${cutoff}
          ORDER BY created_at
          LIMIT ${batchSize}
        )
      `,
    );

    return result.rowCount ?? 0;
  }

  async tryAdvisoryLock(
    lockId: number,
    executor: DatabaseExecutor = this.database,
  ): Promise<boolean> {
    const result = await executor.execute(sql`SELECT pg_try_advisory_lock(${lockId}) AS acquired`);
    const row = result.rows?.[0] as { acquired: boolean } | undefined;
    return row?.acquired === true;
  }

  async unlockAdvisoryLock(
    lockId: number,
    executor: DatabaseExecutor = this.database,
  ): Promise<boolean> {
    const result = await executor.execute(sql`SELECT pg_advisory_unlock(${lockId}) AS released`);
    const row = result.rows?.[0] as { released: boolean } | undefined;
    return row?.released === true;
  }

  async findById(id: string, executor: DatabaseExecutor = this.database) {
    const [row] = await executor.select().from(auditLogs).where(eq(auditLogs.id, id)).limit(1);
    return row ?? null;
  }

  async create(
    values: typeof auditLogs.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ): Promise<typeof auditLogs.$inferSelect> {
    const [auditLog] = await executor.insert(auditLogs).values(values).returning();

    if (!auditLog) {
      throw new Error("Audit log insert returned no rows");
    }

    return auditLog;
  }
}
