import { Module } from "@nestjs/common";
import { USER_LOOKUP } from "@repo/api-core";

import { AccessControlModule } from "../access-control";
import { AuthDataModule } from "../auth/auth-data.module";
import { OrganizationsModule } from "../organizations/organizations.module";
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
import { UsersRepository } from "./infrastructure/users.repository";
import { AdminUsersController } from "./presentation/admin-users.controller";
import { UsersController } from "./presentation/users.controller";

@Module({
  imports: [AccessControlModule, AuthDataModule, OrganizationsModule],
  controllers: [AdminUsersController, UsersController],
  providers: [
    UsersRepository,
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
  ],
  exports: [USER_LOOKUP, USERS_REPOSITORY],
})
export class UsersModule {}
