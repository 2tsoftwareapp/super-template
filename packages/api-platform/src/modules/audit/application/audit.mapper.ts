import type { AuditRepository } from '../infrastructure/audit.repository';

type AuditLogRecord = Awaited<
  ReturnType<AuditRepository['list']>
>['rows'][number];

export class AuditMapper {
  toAuditLogDto(row: AuditLogRecord) {
    return {
      id: row.id,
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
