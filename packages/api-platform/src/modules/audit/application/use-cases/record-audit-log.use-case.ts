import type { JsonObject, RequestContext } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import {  isJsonObject, redactSensitive , SYSTEM_SCOPE } from '@repo/api-core';

import { AUDIT_REPOSITORY, type AuditRepositoryPort } from '../ports/audit.repository.port';

import type { AuditLogInput } from '@repo/api-core';

export type AuditInput = AuditLogInput;

@Injectable()
export class RecordAuditLogUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
  ) {}

  async execute(
    input: AuditInput,
    executor?: TransactionExecutor,
  ) {
    const { actorId, action, entityType, entityId, metadata, requestContext } = input;
    
    const basePayload = {
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
    };

    if (input.scope === 'organization') {
      return this.auditRepository.create(
        {
          ...basePayload,
          scope: SYSTEM_SCOPE.ORGANIZATION,
          organizationId: input.organizationId,
        },
        executor,
      );
    }

    return this.auditRepository.create(
      {
        ...basePayload,
        scope: SYSTEM_SCOPE.PLATFORM,
      },
      executor,
    );
  }
}
