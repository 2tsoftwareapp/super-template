import { Inject, Injectable } from '@nestjs/common';

import type { AuthenticatedRequestUser } from '@repo/api-core';

import type { ListAuditLogsQuery } from '../audit.types';

import { AuditMapper } from '../audit.mapper';
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from '../ports/audit.repository.port';
import { ROLE_NAMES } from '@repo/api-core';

@Injectable()
export class ListAuditLogsUseCase {
  private readonly auditMapper = new AuditMapper();

  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, query: ListAuditLogsQuery) {
    const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    const organizationId = isSuperAdmin && !actor.organizationId 
      ? null 
      : actor.organizationId;

    if (!isSuperAdmin && !organizationId) {
      throw new Error('Organization ID is required for non-super admin');
    }

    const result = await this.auditRepository.list({
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      ...(organizationId ? { organizationId } : {}),
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
