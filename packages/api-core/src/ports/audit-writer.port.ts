import type { JsonObject } from '../common/types/json-value';
import type { RequestContext } from '../common/types/request-context';
import type { TransactionExecutor } from '../common/types/transaction-executor';

export interface AuditLogInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  organizationId?: string | null;
  metadata?: JsonObject | null;
  requestContext?: RequestContext | undefined;
}

export interface AuditWriter {
  log(input: AuditLogInput, executor?: TransactionExecutor): Promise<void>;
}

export const AUDIT_WRITER = Symbol('AUDIT_WRITER');
