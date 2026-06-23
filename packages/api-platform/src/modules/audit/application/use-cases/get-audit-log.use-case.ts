import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { AuditRepository } from '../../infrastructure/audit.repository';
import { AuditMapper } from '../audit.mapper';

@Injectable()
export class GetAuditLogUseCase {
  private readonly auditMapper = new AuditMapper();

  constructor(private readonly auditRepository: AuditRepository) {}

  async execute(id: string) {
    const row = await this.auditRepository.findById(id);

    if (!row) {
      throw new AppError(
        ERROR_CODES.AUDIT_LOG_NOT_FOUND,
        'Audit log not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.auditMapper.toAuditLogDto(row);
  }
}
