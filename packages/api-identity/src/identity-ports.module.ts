import { Global, Module } from '@nestjs/common';

import { AccessControlModule } from './modules/access-control/access-control.module';
import { AuthDataModule } from './modules/auth/auth-data.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { UsersModule } from './modules/users/users.module';

@Global()
@Module({
  imports: [
    AccessControlModule,
    OrganizationsModule,
    PreferencesModule,
    UsersModule,
    AuthDataModule,
  ],
  exports: [
    AccessControlModule,
    OrganizationsModule,
    PreferencesModule,
    UsersModule,
    AuthDataModule,
  ],
})
export class IdentityPortsModule {}
