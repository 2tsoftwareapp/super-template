import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, ROLE_NAMES } from "@repo/api-runtime";

import { AuditMapper } from "../audit.mapper";
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit.repository.port";

@Injectable()
export class GetAuditLogUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    private readonly auditMapper: AuditMapper,
  ) {}

  async execute(actor: AuthenticatedRequestUser, id: string) {
    const row = await this.auditRepository.findById(id);

    if (!row) {
      throw new AppError(
        ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        "Audit log not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    const expectedOrganizationId =
      isSuperAdmin && !actor.organizationId ? null : actor.organizationId;

    if (expectedOrganizationId && row.organizationId !== expectedOrganizationId) {
      throw new AppError(
        ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        "Audit log not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return this.auditMapper.toAuditLogDto(row);
  }
}
