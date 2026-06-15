import { Module } from '@nestjs/common';
import { AccessControlService } from './application/access-control.service';
import { AccessControlRepository } from './infrastructure/access-control.repository';

@Module({
  providers: [AccessControlRepository, AccessControlService],
  exports: [AccessControlRepository, AccessControlService],
})
export class AccessControlModule {}
