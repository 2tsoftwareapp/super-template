import { Module } from '@nestjs/common';

export { IdentityPortsModule } from './identity-ports.module';

export {
  ADMIN_PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_NAMES,
  PRIVILEGED_ROLE_NAMES,
  ROLE_NAMES,
  USER_PERMISSIONS,
} from '@repo/api-core';

import { IdentityPortsModule } from './identity-ports.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    IdentityPortsModule,
    AccessControlModule,
    OrganizationsModule,
    PreferencesModule,
    UsersModule,
    AuthModule,
  ],
  exports: [
    IdentityPortsModule,
    AccessControlModule,
    OrganizationsModule,
    PreferencesModule,
    UsersModule,
    AuthModule,
  ],
})
export class IdentityModule {}
