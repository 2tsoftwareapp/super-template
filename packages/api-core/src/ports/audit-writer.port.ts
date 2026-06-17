import type { RequestContext } from '../common/types/request-context';

export interface AuditLogInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  requestContext?: RequestContext | undefined;
}

export interface AuditWriter {
  log(input: AuditLogInput, executor?: unknown): Promise<unknown>;
}

export const AUDIT_WRITER = Symbol('AUDIT_WRITER');
