import { Global, Module } from '@nestjs/common';

import { AccessControlModule } from './modules/access-control/access-control.module';
import { AuthDataModule } from './modules/auth/auth-data.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';

@Global()
@Module({
  imports: [
    AccessControlModule,
    OrganizationsModule,
    UsersModule,
    AuthDataModule,
  ],
  exports: [
    AccessControlModule,
    OrganizationsModule,
    UsersModule,
    AuthDataModule,
  ],
})
export class IdentityPortsModule {}
