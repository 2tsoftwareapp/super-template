import { Global, Module } from "@nestjs/common";
import {
  AUTH_USER_STORE,
  ORGANIZATION_MEMBERSHIP,
  USER_LOOKUP,
  USER_ROLE_ASSIGNMENTS,
} from "@repo/api-runtime";
import { AccessControlModule } from "@repo/feature-access-control/contracts";
import { OrganizationsModule } from "@repo/feature-organizations/contracts";

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
import { LazyPortRegistrarService } from "./infrastructure/lazy-port-registrar.service";
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
    LazyPortRegistrarService,
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
      provide: AUTH_USER_STORE,
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
  ],
  exports: [
    USER_LOOKUP,
    USERS_REPOSITORY,
    AUTH_USER_STORE,
    ORGANIZATION_MEMBERSHIP,
    USER_ROLE_ASSIGNMENTS,
  ],
})
export class UsersModule {}
