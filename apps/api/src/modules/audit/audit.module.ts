import { Module } from '@nestjs/common';
import { AuditService } from './application/audit.service';
import { AuditRepository } from './infrastructure/audit.repository';

@Module({
  providers: [AuditRepository, AuditService],
  exports: [AuditRepository, AuditService],
})
export class AuditModule {}
