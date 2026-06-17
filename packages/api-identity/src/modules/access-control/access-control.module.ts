import { Module } from '@nestjs/common';

import { AccessControlService } from './application/access-control.service';
import { AccessControlRepository } from './infrastructure/access-control.repository';
import { AdminRolesController } from './presentation/admin-roles.controller';

@Module({
  controllers: [AdminRolesController],
  providers: [AccessControlRepository, AccessControlService],
  exports: [AccessControlRepository, AccessControlService],
})
export class AccessControlModule {}
