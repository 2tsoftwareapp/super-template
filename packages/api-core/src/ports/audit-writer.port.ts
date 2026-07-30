import type { SYSTEM_SCOPE } from '../common/constants/system.constants';
import type { JsonObject } from '../common/types/json-value';
import type { RequestContext } from '../common/types/request-context';
import type { TransactionExecutor } from '../common/types/transaction-executor';

export interface AuditLogBaseInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: JsonObject | null;
  requestContext?: RequestContext | undefined;
}

export type AuditLogInput = AuditLogBaseInput &
  (
    | {
        /**
         * Indicates this audit log belongs to a specific tenant/organization.
         * organizationId is strictly required.
         */
        scope: typeof SYSTEM_SCOPE.ORGANIZATION;
        organizationId: string;
      }
    | {
        /**
         * Indicates this audit log is a platform-level event (not tied to any tenant).
         * organizationId must NOT be provided.
         */
        scope: typeof SYSTEM_SCOPE.PLATFORM;
        organizationId?: never;
      }
  );

export interface AuditWriter {
  log(input: AuditLogInput, executor?: TransactionExecutor): Promise<void>;
}

export const AUDIT_WRITER = Symbol('AUDIT_WRITER');
