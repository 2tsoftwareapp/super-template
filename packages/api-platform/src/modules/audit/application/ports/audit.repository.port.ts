import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

export interface AuditLogRecord {
  id: string;
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

export interface CreateAuditLogInput {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: JsonObject | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
}

export interface ListAuditLogsParams {
  page: number;
  limit: number;
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
  'actorId' | 'action' | 'resourceType' | 'resourceId' | 'from' | 'to' | 'q'
>;

export interface AuditLogListResult {
  rows: AuditLogRecord[];
  total: number;
}

export interface AuditRepositoryPort {
  list(params: ListAuditLogsParams, executor?: DatabaseExecutor): Promise<AuditLogListResult>;
  listForExport(params: AuditLogSearchParams & { limit: number }, executor?: DatabaseExecutor): Promise<AuditLogRecord[]>;
  deleteOlderThan(cutoff: Date, executor?: DatabaseExecutor): Promise<number>;
  findById(id: string, executor?: DatabaseExecutor): Promise<AuditLogRecord | null>;
  create(values: CreateAuditLogInput, executor?: DatabaseExecutor): Promise<AuditLogRecord>;
}

export const AUDIT_REPOSITORY = Symbol('AUDIT_REPOSITORY');
