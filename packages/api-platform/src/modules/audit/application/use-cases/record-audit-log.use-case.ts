import type { JsonObject, RequestContext } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { isJsonObject, redactSensitive } from '@repo/api-core';

import { AUDIT_REPOSITORY, type AuditRepositoryPort } from '../ports/audit.repository.port';

export interface AuditInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  organizationId?: string | null;
  metadata?: JsonObject | null;
  requestContext?: RequestContext | undefined;
}

@Injectable()
export class RecordAuditLogUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
  ) {}

  async execute(
    {
      actorId,
      action,
      entityType,
      entityId,
      organizationId,
      metadata,
      requestContext,
    }: AuditInput,
    executor?: TransactionExecutor,
  ) {
    return this.auditRepository.create(
      {
        actorId: actorId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        organizationId: organizationId ?? null,
        metadata: metadata
          ? (() => {
              const redacted = redactSensitive(metadata);
              return isJsonObject(redacted) ? redacted : null;
            })()
          : null,
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
        requestId: requestContext?.requestId ?? null,
      },
      executor,
    );
  }
}
