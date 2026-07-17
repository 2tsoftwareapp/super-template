import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';
import type { AuthenticatedRequestUser } from '@repo/api-core';

import { AuditMapper } from '../audit.mapper';
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from '../ports/audit.repository.port';

@Injectable()
export class GetAuditLogUseCase {
  private readonly auditMapper = new AuditMapper();

  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, id: string) {
    const row = await this.auditRepository.findById(id);

    if (!row) {
      throw new AppError(
        ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        'Audit log not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isSuperAdmin = actor.roles.includes('SUPER_ADMIN');
    if (
      !isSuperAdmin &&
      row.organizationId &&
      row.organizationId !== actor.organizationId
    ) {
      throw new AppError(
        ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        'Audit log not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.auditMapper.toAuditLogDto(row);
  }
}
