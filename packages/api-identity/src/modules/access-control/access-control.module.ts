import { Module } from "@nestjs/common";
import { AccessProfileCache } from "@repo/api-core";
import { AppConfigModule } from "@repo/api-core/config/app-config.module";

import { AccessControlMapper } from "./application/access-control.mapper";
import { AccessControlService } from "./application/access-control.service";
import { ACCESS_CONTROL_REPOSITORY } from "./application/ports/access-control.repository.port";
import { AccessProfileUseCase } from "./application/use-cases/access-profile.use-case";
import { CreateCustomRoleUseCase } from "./application/use-cases/create-custom-role.use-case";
import { DeleteCustomRoleUseCase } from "./application/use-cases/delete-custom-role.use-case";
import { EnsureOrganizationAdminRoleUseCase } from "./application/use-cases/ensure-organization-admin-role.use-case";
import { ReplaceUserRolesUseCase } from "./application/use-cases/replace-user-roles.use-case";
import { RoleManagementUseCase } from "./application/use-cases/role-management.use-case";
import { RoleQueryUseCase } from "./application/use-cases/role-query.use-case";
import { SeedAccessControlUseCase } from "./application/use-cases/seed-access-control.use-case";
import { UpdateCustomRoleUseCase } from "./application/use-cases/update-custom-role.use-case";
import { AccessControlAssignmentPersistence } from "./infrastructure/access-control-assignment.persistence";
import { AccessControlPermissionPersistence } from "./infrastructure/access-control-permission.persistence";
import { AccessControlRolePersistence } from "./infrastructure/access-control-role.persistence";
import { AccessControlRepository } from "./infrastructure/access-control.repository";
import { AdminRolesController } from "./presentation/admin-roles.controller";

@Module({
  imports: [AppConfigModule],
  controllers: [AdminRolesController],
  providers: [
    AccessControlRolePersistence,
    AccessControlPermissionPersistence,
    AccessControlAssignmentPersistence,
    AccessControlRepository,
    AccessControlMapper,
    AccessProfileUseCase,
    SeedAccessControlUseCase,
    RoleQueryUseCase,
    CreateCustomRoleUseCase,
    UpdateCustomRoleUseCase,
    DeleteCustomRoleUseCase,
    EnsureOrganizationAdminRoleUseCase,
    RoleManagementUseCase,
    ReplaceUserRolesUseCase,
    AccessControlService,
    AccessProfileCache,
    {
      provide: ACCESS_CONTROL_REPOSITORY,
      useExisting: AccessControlRepository,
    },
  ],
  exports: [AccessControlRepository, AccessControlService, ACCESS_CONTROL_REPOSITORY],
})
export class AccessControlModule {}
