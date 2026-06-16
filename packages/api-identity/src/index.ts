import { Module } from '@nestjs/common';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AccessControlModule,
    OrganizationsModule,
    PreferencesModule,
    UsersModule,
    AuthModule,
  ],
  exports: [
    AccessControlModule,
    OrganizationsModule,
    PreferencesModule,
    UsersModule,
    AuthModule,
  ],
})
export class IdentityModule {}
