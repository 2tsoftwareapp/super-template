import type { JsonObject } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';
import type { SYSTEM_SCOPE } from '@repo/api-core';

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
  sortOrder: 'asc' | 'desc';
}

export type AuditLogSearchParams = Pick<
  ListAuditLogsParams,
  | 'organizationId'
  | 'actorId'
  | 'action'
  | 'resourceType'
  | 'resourceId'
  | 'from'
  | 'to'
  | 'q'
>;

export interface AuditLogListResult {
  rows: AuditLogRecord[];
  total: number;
}

export interface AuditRepositoryPort {
  list(params: ListAuditLogsParams, executor?: TransactionExecutor): Promise<AuditLogListResult>;
  listForExport(params: AuditLogSearchParams & { limit: number }, executor?: TransactionExecutor): Promise<AuditLogRecord[]>;
  count(params: AuditLogSearchParams, executor?: TransactionExecutor): Promise<number>;
  deleteOlderThanBatched(cutoff: Date, batchSize: number, executor?: TransactionExecutor): Promise<number>;
  tryAdvisoryLock(lockId: number, executor?: TransactionExecutor): Promise<boolean>;
  unlockAdvisoryLock(lockId: number, executor?: TransactionExecutor): Promise<boolean>;
  findById(id: string, executor?: TransactionExecutor): Promise<AuditLogRecord | null>;
  create(values: CreateAuditLogInput, executor?: TransactionExecutor): Promise<AuditLogRecord>;
}

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');
