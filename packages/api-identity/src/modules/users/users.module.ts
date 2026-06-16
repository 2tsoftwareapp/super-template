import { Module } from '@nestjs/common';
import { AccessControlModule } from '../access-control/access-control.module';
import { AuditModule } from '@repo/api-platform/modules/audit/audit.module';
import { AuthDataModule } from '../auth/auth-data.module';
import { FilesModule } from '@repo/api-platform/modules/files/files.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersService } from './application/users.service';
import { UsersRepository } from './infrastructure/users.repository';
import { AdminUsersController } from './presentation/admin-users.controller';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [
    AccessControlModule,
    AuditModule,
    AuthDataModule,
    FilesModule,
    OrganizationsModule,
  ],
  controllers: [AdminUsersController, UsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
