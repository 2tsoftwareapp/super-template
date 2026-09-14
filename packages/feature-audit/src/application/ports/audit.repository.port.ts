import type { JsonObject } from "@repo/api-kernel";
import type { TransactionExecutor } from "@repo/api-kernel";
import type { SYSTEM_SCOPE } from "@repo/api-kernel";

export interface AuditLogRecord {
  id: string;
  organizationId: string | null;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: JsonObject | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: Date;
}

export interface CreateAuditLogBaseInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: JsonObject | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
}

export type CreateAuditLogInput = CreateAuditLogBaseInput &
  (
    | {
        scope: typeof SYSTEM_SCOPE.ORGANIZATION;
        organizationId: string;
      }
    | {
        scope: typeof SYSTEM_SCOPE.PLATFORM;
        organizationId?: never;
      }
  );

export interface ListAuditLogsParams {
  page: number;
  limit: number;
  organizationId?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  q?: string;
  sortOrder: "asc" | "desc";
}

export type AuditLogSearchParams = Pick<
  ListAuditLogsParams,
  "organizationId" | "actorId" | "action" | "resourceType" | "resourceId" | "from" | "to" | "q"
>;

export interface AuditLogListResult {
  rows: AuditLogRecord[];
  total: number;
}

export interface AuditRepositoryPort {
  list(params: ListAuditLogsParams, executor?: TransactionExecutor): Promise<AuditLogListResult>;
  listForExport(
    params: AuditLogSearchParams & { limit: number },
    executor?: TransactionExecutor,
  ): Promise<AuditLogRecord[]>;
  count(params: AuditLogSearchParams, executor?: TransactionExecutor): Promise<number>;
  /**
   * Deletes up to `batchSize` audit rows older than `cutoff` and returns how
   * many were removed.
   *
   * Mutual exclusion between replicas is owned by the kernel's
   * `ADVISORY_LOCK_PORT` (`withAdvisoryLock`), which
   * `PurgeExpiredAuditLogsUseCase` wraps around the whole purge run. An earlier
   * `tryAdvisoryLock`/`unlockAdvisoryLock` pair on this port duplicated that
   * lock and was called from nowhere, so it was removed instead of being kept
   * as a second, unused way to take the same lock.
   */
  deleteOlderThanBatched(
    cutoff: Date,
    batchSize: number,
    executor?: TransactionExecutor,
  ): Promise<number>;
  findById(id: string, executor?: TransactionExecutor): Promise<AuditLogRecord | null>;
  create(values: CreateAuditLogInput, executor?: TransactionExecutor): Promise<AuditLogRecord>;
}

export const AUDIT_REPOSITORY = Symbol("AUDIT_REPOSITORY");
