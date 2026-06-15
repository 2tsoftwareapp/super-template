import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../common/types/request-context';
import { redactSensitive } from '../../../common/utils/redact';
import type { DatabaseExecutor } from '../../../database/database.types';
import { AuditRepository } from '../infrastructure/audit.repository';

type AuditInput = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  requestContext?: RequestContext | undefined;
};

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(
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
          ? (redactSensitive(metadata) as Record<string, unknown>)
          : null,
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
        requestId: requestContext?.requestId ?? null,
      },
      executor,
    );
  }
}
