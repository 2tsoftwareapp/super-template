import { Module } from '@nestjs/common';

export { IdentityPortsModule } from './identity-ports.module';

export { AccessControlService } from './modules/access-control/application/access-control.service';
export { OrganizationsRepository } from './modules/organizations/infrastructure/organizations.repository';

export {
  ACTION,
  hasPermission,
  perm,
  PRIVILEGED_ROLE_NAMES,
  ROLE_NAMES,
} from '@repo/api-core';

import { IdentityPortsModule } from './identity-ports.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { SsoModule } from './modules/sso/sso.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    IdentityPortsModule,
    AccessControlModule,
    OrganizationsModule,
    PreferencesModule,
    UsersModule,
    AuthModule,
    SsoModule,
  ],
  exports: [
    IdentityPortsModule,
    AccessControlModule,
    OrganizationsModule,
    PreferencesModule,
    UsersModule,
    AuthModule,
    SsoModule,
  ],
})
export class IdentityModule {}
