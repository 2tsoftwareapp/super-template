import { Module } from '@nestjs/common';
import { AUDIT_WRITER } from '@repo/api-core';

import { AuditService } from './application/audit.service';
import { ListAuditLogsUseCase } from './application/use-cases/list-audit-logs.use-case';
import { RecordAuditLogUseCase } from './application/use-cases/record-audit-log.use-case';
import { AuditRepository } from './infrastructure/audit.repository';
import { AuditController } from './presentation/audit.controller';

@Module({
  controllers: [AuditController],
  providers: [
    AuditRepository,
    RecordAuditLogUseCase,
    ListAuditLogsUseCase,
    AuditService,
    {
      provide: AUDIT_WRITER,
      useExisting: AuditService,
    },
  ],
  exports: [AuditRepository, AuditService, AUDIT_WRITER],
})
export class AuditModule {}
