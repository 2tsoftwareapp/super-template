import { Module } from '@nestjs/common';
import { AccessProfileCache, AppConfigModule } from '@repo/api-core';

import { AccessControlMapper } from './application/access-control.mapper';
import { ACCESS_CONTROL_REPOSITORY } from './application/access-control.repository.port';
import { AccessControlService } from './application/access-control.service';
import { AccessProfileUseCase } from './application/access-profile.use-case';
import { ReplaceUserRolesUseCase } from './application/replace-user-roles.use-case';
import { RoleQueryUseCase } from './application/role-query.use-case';
import { SeedAccessControlUseCase } from './application/seed-access-control.use-case';
import { AccessControlRepository } from './infrastructure/access-control.repository';
import { AdminRolesController } from './presentation/admin-roles.controller';

@Module({
  imports: [AppConfigModule],
  controllers: [AdminRolesController],
  providers: [
    AccessControlRepository,
    AccessControlMapper,
    AccessProfileUseCase,
    SeedAccessControlUseCase,
    RoleQueryUseCase,
    ReplaceUserRolesUseCase,
    AccessControlService,
    AccessProfileCache,
    {
      provide: ACCESS_CONTROL_REPOSITORY,
      useExisting: AccessControlRepository,
    },
  ],
  exports: [
    AccessControlRepository,
    AccessControlService,
    ACCESS_CONTROL_REPOSITORY,
  ],
})
export class AccessControlModule {}
