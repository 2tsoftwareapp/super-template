import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";

import { canReadAuditRow, resolveAuditReadScope } from "../../domain/audit-read-scope.policy";
import { AUDIT_ERROR_CODES } from "../../public/error-codes";
import { AuditMapper } from "../audit.mapper";
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit.repository.port";

@Injectable()
export class GetAuditLogUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    private readonly auditMapper: AuditMapper,
  ) {}

  async execute(actor: AuthenticatedRequestUser, id: string) {
    // Scope first: an org-less non-super actor is rejected before any row is
    // read, exactly like the list use case does.
    const scope = resolveAuditReadScope(actor);

    const row = await this.auditRepository.findById(id);

    if (!row) {
      throw new AppError(
        AUDIT_ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        "Audit log not found",
        HttpStatus.NOT_FOUND,
      );
    }

    if (!canReadAuditRow(scope, row.organizationId)) {
      throw new AppError(
        AUDIT_ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        "Audit log not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return this.auditMapper.toAuditLogDto(row);
  }
}
