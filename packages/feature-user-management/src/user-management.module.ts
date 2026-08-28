import { Module } from "@nestjs/common";
import { GetUserUseCase } from "./application/use-cases/get-user.use-case";
import { ListUsersUseCase } from "./application/use-cases/list-users.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";
import { ChangePasswordUseCase } from "./application/use-cases/change-password.use-case";
import { CreateAdminUserUseCase } from "./application/use-cases/create-admin-user.use-case";
import { UpdateAdminUserUseCase } from "./application/use-cases/update-admin-user.use-case";
import { DeleteUserUseCase } from "./application/use-cases/delete-user.use-case";
import { UpdateUserStatusUseCase } from "./application/use-cases/update-user-status.use-case";
import { ReplaceUserRolesUseCase } from "./application/use-cases/replace-user-roles.use-case";
import { AdminUsersController } from "./presentation/admin-users.controller";
import { UsersController } from "./presentation/users.controller";
import { UsersModule } from "@repo/feature-users/module";
import { USERS_REPOSITORY } from "@repo/feature-users/contracts";
import { UserManagementRepository } from "./infrastructure-users.repository";

@Module({
  imports: [UsersModule],
  controllers: [AdminUsersController, UsersController],
  providers: [
    GetUserUseCase, ListUsersUseCase, UpdateProfileUseCase, ChangePasswordUseCase,
    CreateAdminUserUseCase, UpdateAdminUserUseCase, DeleteUserUseCase,
    UpdateUserStatusUseCase,     ReplaceUserRolesUseCase,
    UserManagementRepository,
    { provide: USERS_REPOSITORY, useExisting: UserManagementRepository },
  ],
})
export class UserManagementModule {}
