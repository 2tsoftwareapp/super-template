import { Module } from "@nestjs/common";

export { IdentityPortsModule } from "./identity-ports.module";

export { ACCESS_CONTROL_REPOSITORY } from "./modules/access-control";

export type * from "./modules/access-control";

export { AccessControlService } from "./modules/access-control";
export type * from "./modules/organizations";
export { ORGANIZATIONS_REPOSITORY } from "./modules/organizations";
export type * from "./modules/users";
export { USERS_REPOSITORY } from "./modules/users";
import { IdentityPortsModule } from "./identity-ports.module";
import { AccessControlModule } from "./modules/access-control";
import { AuthModule } from "./modules/auth";
import { OrganizationsModule } from "./modules/organizations";
import { PreferencesModule } from "./modules/preferences/preferences.module";
import { SsoModule } from "./modules/sso/sso.module";
import { UsersModule } from "./modules/users";

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
