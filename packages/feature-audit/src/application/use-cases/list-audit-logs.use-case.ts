import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";

import type { ListAuditLogsQuery } from "../audit.types";

import { resolveAuditReadScope } from "../../domain/audit-read-scope.policy";
import { AuditMapper } from "../audit.mapper";
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit.repository.port";

@Injectable()
export class ListAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    private readonly auditMapper: AuditMapper,
  ) {}

  async execute(actor: AuthenticatedRequestUser, query: ListAuditLogsQuery) {
    // Single source of truth for the read scope: SUPER_ADMIN sees the full audit
    // trail (platform-scoped rows included), organization actors stay scoped to
    // their organization, org-less non-super actors are rejected.
    const scope = resolveAuditReadScope(actor);
    const organizationId = scope.kind === "organization" ? scope.organizationId : null;

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
