import { Module } from '@nestjs/common';
import { USER_LOOKUP } from '@repo/api-core';

import { AccessControlModule } from '../access-control/access-control.module';
import { AuthDataModule } from '../auth/auth-data.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersService } from './application/users.service';
import { UsersRepository } from './infrastructure/users.repository';
import { AdminUsersController } from './presentation/admin-users.controller';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [
    AccessControlModule,
    AuthDataModule,
    OrganizationsModule,
  ],
  controllers: [AdminUsersController, UsersController],
  providers: [
    UsersRepository,
    UsersService,
    {
      provide: USER_LOOKUP,
      useExisting: UsersRepository,
    },
  ],
  exports: [UsersRepository, UsersService, USER_LOOKUP],
})
export class UsersModule {}
