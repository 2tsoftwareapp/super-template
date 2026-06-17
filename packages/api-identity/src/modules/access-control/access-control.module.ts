import { Module } from '@nestjs/common';
import { AccessProfileCache, AppConfigModule } from '@repo/api-core';

import { AccessControlService } from './application/access-control.service';
import { AccessControlRepository } from './infrastructure/access-control.repository';
import { AdminRolesController } from './presentation/admin-roles.controller';

@Module({
  imports: [AppConfigModule],
  controllers: [AdminRolesController],
  providers: [AccessControlRepository, AccessControlService, AccessProfileCache],
  exports: [AccessControlRepository, AccessControlService],
})
export class AccessControlModule {}
