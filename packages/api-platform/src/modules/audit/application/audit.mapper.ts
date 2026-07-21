import { Injectable } from '@nestjs/common';

import type { AuditLogRecord } from './ports/audit.repository.port';

@Injectable()
export class AuditMapper {
  toAuditLogDto(row: AuditLogRecord) {
    return {
      id: row.id,
      organizationId: row.organizationId,
      actorId: row.actorId,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      requestId: row.requestId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
