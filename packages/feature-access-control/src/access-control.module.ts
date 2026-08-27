import { Global, Module } from "@nestjs/common";
import { AccessProfileCache } from "@repo/api-runtime";
import { AppConfigModule } from "@repo/api-runtime";
import {
  ORGANIZATION_USER_ROLES_PURGE,
} from "@repo/feature-organizations/contracts";
import { ACCESS_CONTROL_REPOSITORY } from "./public/access-control-repository.token";
import { USER_ROLE_ASSIGNMENTS } from "./public/user-role-assignments.token";

import { AccessControlMapper } from "./application/access-control.mapper";
import { AccessControlService } from "./application/access-control.service";
import { AccessProfileUseCase } from "./application/use-cases/access-profile.use-case";
import { CreateCustomRoleUseCase } from "./application/use-cases/create-custom-role.use-case";
import { DeleteCustomRoleUseCase } from "./application/use-cases/delete-custom-role.use-case";
import { EnsureOrganizationAdminRoleUseCase } from "./application/use-cases/ensure-organization-admin-role.use-case";
import { ReplaceUserRolesUseCase } from "./application/use-cases/replace-user-roles.use-case";
import { RoleManagementUseCase } from "./application/use-cases/role-management.use-case";
import { RoleQueryUseCase } from "./application/use-cases/role-query.use-case";
import { SeedAccessControlUseCase } from "./application/use-cases/seed-access-control.use-case";
import { UpdateCustomRoleUseCase } from "./application/use-cases/update-custom-role.use-case";
import { AccessControlPermissionPersistence } from "./infrastructure/access-control-permission.persistence";
import { AccessControlRolePersistence } from "./infrastructure/access-control-role.persistence";
import { AccessControlRepository } from "./infrastructure/access-control.repository";
import {
  ORGANIZATION_ACCESS_CONTROL_PROVIDER,
  OrganizationAccessControlAdapter,
} from "./infrastructure/organization-access-control.adapter";
import {
  ORGANIZATION_CUSTOM_ROLES_PURGE_PROVIDER,
  OrganizationCustomRolesPurgeAdapter,
} from "./infrastructure/organization-custom-roles-purge.adapter";
import { UserRoleAssignmentsPersistence } from "./infrastructure/user-role-assignments.persistence";
import { AdminRolesController } from "./presentation/admin-roles.controller";

@Global()
@Module({
  imports: [AppConfigModule],
  controllers: [AdminRolesController],
  providers: [
    AccessControlRolePersistence,
    AccessControlPermissionPersistence,
    UserRoleAssignmentsPersistence,
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
    OrganizationCustomRolesPurgeAdapter,
    OrganizationAccessControlAdapter,
    {
      provide: ACCESS_CONTROL_REPOSITORY,
      useExisting: AccessControlRepository,
    },
    {
      provide: USER_ROLE_ASSIGNMENTS,
      useExisting: UserRoleAssignmentsPersistence,
    },
    {
      provide: ORGANIZATION_USER_ROLES_PURGE,
      useExisting: UserRoleAssignmentsPersistence,
    },
  ],
  exports: [
    AccessControlRepository,
    AccessControlService,
    ACCESS_CONTROL_REPOSITORY,
    USER_ROLE_ASSIGNMENTS,
    ORGANIZATION_USER_ROLES_PURGE,
  ],
})
export class AccessControlModule {}
