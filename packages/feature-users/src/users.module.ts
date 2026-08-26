import { Global, Module } from "@nestjs/common";
import { AccessControlModule, USER_ROLE_ASSIGNMENTS } from "@repo/feature-access-control/contracts";
import {
  ORGANIZATION_MEMBERSHIP,
  ORGANIZATION_USER_ROLES_PURGE,
} from "@repo/feature-organizations/contracts";
import { OrganizationsModule } from "@repo/feature-organizations/contracts";
import { USER_LOOKUP } from "@repo/feature-users/contracts";

import { USERS_REPOSITORY } from "./application/ports/users.repository.port";
import { ChangePasswordUseCase } from "./application/use-cases/change-password.use-case";
import { CreateAdminUserUseCase } from "./application/use-cases/create-admin-user.use-case";
import { DeleteUserUseCase } from "./application/use-cases/delete-user.use-case";
import { GetUserUseCase } from "./application/use-cases/get-user.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { ReplaceUserRolesUseCase } from "./application/use-cases/replace-user-roles.use-case";
import { UpdateAdminUserUseCase } from "./application/use-cases/update-admin-user.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";
import { UpdateUserStatusUseCase } from "./application/use-cases/update-user-status.use-case";
import { UsersMapper } from "./application/users.mapper";
import { OrganizationMembersRepository } from "./infrastructure/organization-members.repository";
import { UserRoleAssignmentsPersistence } from "./infrastructure/user-role-assignments.persistence";
import { UsersRepository } from "./infrastructure/users.repository";
import { AdminUsersController } from "./presentation/admin-users.controller";
import { UsersController } from "./presentation/users.controller";

@Global()
@Module({
  imports: [AccessControlModule, OrganizationsModule],
  controllers: [AdminUsersController, UsersController],
  providers: [
    UsersRepository,
    OrganizationMembersRepository,
    UserRoleAssignmentsPersistence,
    UsersMapper,
    GetUserUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
    ListUsersUseCase,
    CreateAdminUserUseCase,
    UpdateAdminUserUseCase,
    DeleteUserUseCase,
    UpdateUserStatusUseCase,
    ReplaceUserRolesUseCase,
    {
      provide: USERS_REPOSITORY,
      useExisting: UsersRepository,
    },
    {
      provide: USER_LOOKUP,
      useExisting: UsersRepository,
    },
    {
      provide: ORGANIZATION_MEMBERSHIP,
      useExisting: OrganizationMembersRepository,
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
    USER_LOOKUP,
    USERS_REPOSITORY,
    ORGANIZATION_MEMBERSHIP,
    USER_ROLE_ASSIGNMENTS,
    ORGANIZATION_USER_ROLES_PURGE,
  ],
})
export class UsersModule {}
