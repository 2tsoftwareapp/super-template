import { Inject, Injectable } from '@nestjs/common';

import type { ListAuditLogsQuery } from '../audit.types';

import { AuditMapper } from '../audit.mapper';
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from '../ports/audit.repository.port';

@Injectable()
export class ListAuditLogsUseCase {
  private readonly auditMapper = new AuditMapper();

  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
  ) {}

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
      ...(query.q !== undefined ? { q: query.q } : {}),
    });

    return {
      rows: result.rows.map((row) => this.auditMapper.toAuditLogDto(row)),
      total: result.total,
    };
  }
}
