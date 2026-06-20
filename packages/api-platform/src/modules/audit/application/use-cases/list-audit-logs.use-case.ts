import { Injectable } from '@nestjs/common';

import type { ListAuditLogsQuery } from '../audit.types';

import { AuditRepository } from '../../infrastructure/audit.repository';
import { AuditMapper } from '../audit.mapper';

@Injectable()
export class ListAuditLogsUseCase {
  private readonly auditMapper = new AuditMapper();

  constructor(private readonly auditRepository: AuditRepository) {}

  async execute(query: ListAuditLogsQuery) {
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
