import type { JsonObject, RequestContext } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';
import { isJsonObject, redactSensitive } from '@repo/api-core';

import { AuditRepository } from '../../infrastructure/audit.repository';

export interface AuditInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: JsonObject | null;
  requestContext?: RequestContext | undefined;
}

@Injectable()
export class RecordAuditLogUseCase {
  constructor(private readonly auditRepository: AuditRepository) {}

  async execute(
    {
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      requestContext,
    }: AuditInput,
    executor?: DatabaseExecutor,
  ) {
    return this.auditRepository.create(
      {
        actorId: actorId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
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
