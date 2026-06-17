import { Module } from '@nestjs/common';
export * from './modules/access-control/access-control.constants';
export { AccessControlModule } from './modules/access-control/access-control.module';
export { AccessControlService } from './modules/access-control/application/access-control.service';
export * from './modules/auth/application/auth.helpers';
export { AuthService } from './modules/auth/application/auth.service';
export { AuthDataModule } from './modules/auth/auth-data.module';
export { AuthModule } from './modules/auth/auth.module';
export { AuthRepository } from './modules/auth/infrastructure/auth.repository';
export { OrganizationsService } from './modules/organizations/application/organizations.service';
export { OrganizationsModule } from './modules/organizations/organizations.module';
export { PreferencesService } from './modules/preferences/application/preferences.service';
export { PreferencesModule } from './modules/preferences/preferences.module';
export { UsersRepository } from './modules/users/infrastructure/users.repository';
export { UsersModule } from './modules/users/users.module';
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
