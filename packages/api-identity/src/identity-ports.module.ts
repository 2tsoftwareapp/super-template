import { Global, Module } from "@nestjs/common";

import { AccessControlModule } from "./modules/access-control";
import { AuthDataModule } from "./modules/auth";
import { OrganizationsModule } from "./modules/organizations";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { UsersModule } from "./modules/users";

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
