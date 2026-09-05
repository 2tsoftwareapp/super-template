import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";

import { AUDIT_ERROR_CODES } from "../../public/error-codes";
import { AuditMapper } from "../audit.mapper";
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit.repository.port";

/** Platform super-role literal; importing access-control here would create a package cycle. */
const PLATFORM_SUPER_ADMIN = "SUPER_ADMIN";

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
        AUDIT_ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        "Audit log not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const isSuperAdmin = actor.roles.includes(PLATFORM_SUPER_ADMIN);

    const expectedOrganizationId =
      isSuperAdmin && !actor.organizationId ? null : actor.organizationId;

    if (expectedOrganizationId && row.organizationId !== expectedOrganizationId) {
      throw new AppError(
        AUDIT_ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        "Audit log not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return this.auditMapper.toAuditLogDto(row);
  }
}
