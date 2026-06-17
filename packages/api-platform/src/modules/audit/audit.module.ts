import { Module } from '@nestjs/common';
import { AUDIT_WRITER } from '@repo/api-core';
import { AccessControlModule } from '@repo/api-identity/modules/access-control/access-control.module';

import { AuditService } from './application/audit.service';
import { AuditRepository } from './infrastructure/audit.repository';
import { AuditController } from './presentation/audit.controller';

@Module({
  imports: [AccessControlModule],
  controllers: [AuditController],
  providers: [
    AuditRepository,
    AuditService,
    {
      provide: AUDIT_WRITER,
      useExisting: AuditService,
    },
  ],
  exports: [AuditRepository, AuditService, AUDIT_WRITER],
})
export class AuditModule {}
