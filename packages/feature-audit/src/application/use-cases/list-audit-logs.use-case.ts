import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import type { ListAuditLogsQuery } from "../audit.types";

import { AuditMapper } from "../audit.mapper";
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit.repository.port";

/** Platform super-role literal; importing access-control here would create a package cycle. */
const PLATFORM_SUPER_ADMIN = "SUPER_ADMIN";

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    private readonly auditMapper: AuditMapper,
  ) {}

  async execute(actor: AuthenticatedRequestUser, query: ListAuditLogsQuery) {
    const isSuperAdmin = actor.roles.includes(PLATFORM_SUPER_ADMIN);

    // SUPER_ADMIN sees the full audit trail (including platform-scoped rows
    // recorded without an organization); non-super admins stay scoped to
    // their organization.
    const organizationId = isSuperAdmin ? null : actor.organizationId;

    if (!isSuperAdmin && !organizationId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Organization ID is required for non-super admin",
        HttpStatus.FORBIDDEN,
      );
    }

    const result = await this.auditRepository.list({
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
      ...(organizationId ? { organizationId } : {}),
      ...(query.actorId !== undefined ? { actorId: query.actorId } : {}),
      ...(query.action !== undefined ? { action: query.action } : {}),
      ...(query.resourceType !== undefined ? { resourceType: query.resourceType } : {}),
      ...(query.resourceId !== undefined ? { resourceId: query.resourceId } : {}),
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
