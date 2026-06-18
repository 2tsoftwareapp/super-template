import { Module } from '@nestjs/common';
import { USER_LOOKUP } from '@repo/api-core';

import { AccessControlModule } from '../access-control/access-control.module';
import { AuthDataModule } from '../auth/auth-data.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { AdminUserManagementUseCase } from './application/admin-user-management.use-case';
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { CreateAdminUserUseCase } from './application/create-admin-user.use-case';
import { GetUserUseCase } from './application/get-user.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import { ReplaceUserRolesUseCase } from './application/replace-user-roles.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { UsersMapper } from './application/users.mapper';
import { USERS_REPOSITORY } from './application/users.repository.port';
import { UsersService } from './application/users.service';
import { UsersRepository } from './infrastructure/users.repository';
import { AdminUsersController } from './presentation/admin-users.controller';
import { UsersController } from './presentation/users.controller';

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
    AdminUserManagementUseCase,
    ReplaceUserRolesUseCase,
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useExisting: UsersRepository,
    },
    {
      provide: USER_LOOKUP,
      useExisting: UsersRepository,
    },
  ],
  exports: [
    UsersRepository,
    UsersService,
    USER_LOOKUP,
    USERS_REPOSITORY,
  ],
})
export class UsersModule {}
