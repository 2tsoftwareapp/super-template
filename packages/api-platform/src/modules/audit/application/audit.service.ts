import type { RequestContext } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';
import { redactSensitive } from '@repo/api-core';

import type { AuditLogsQueryDto } from '../presentation/audit.dto';

import { AuditRepository } from '../infrastructure/audit.repository';
import { AuditMapper } from './audit.mapper';

interface AuditInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  requestContext?: RequestContext | undefined;
}

@Injectable()
export class AuditService {
  private readonly auditMapper = new AuditMapper();

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

  async listAuditLogs(query: AuditLogsQueryDto) {
    const result = await this.auditRepository.list({
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      ...(query.actorId !== undefined ? { actorId: query.actorId } : {}),
      ...(query.action !== undefined ? { action: query.action } : {}),
      ...(query.resourceType !== undefined
        ? { resourceType: query.resourceType }
        : {}),
      ...(query.resourceId !== undefined
        ? { resourceId: query.resourceId }
        : {}),
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
    });

    return {
      rows: result.rows.map((row) => this.auditMapper.toAuditLogDto(row)),
      total: result.total,
    };
  }
}
