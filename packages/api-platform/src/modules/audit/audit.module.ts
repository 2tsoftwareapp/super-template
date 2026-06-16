import { Module } from '@nestjs/common';
import { AccessControlModule } from '@repo/api-identity/modules/access-control/access-control.module';
import { AuditService } from './application/audit.service';
import { AuditRepository } from './infrastructure/audit.repository';
import { AuditController } from './presentation/audit.controller';

@Module({
  imports: [AccessControlModule],
  controllers: [AuditController],
  providers: [AuditRepository, AuditService],
  exports: [AuditRepository, AuditService],
})
export class AuditModule {}
