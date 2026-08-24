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
import { AuthModule } from "./modules/auth";
import { SsoModule } from "./modules/sso/sso.module";

// IdentityPortsModule (@Global) is the single owner of the data-layer feature
// modules (access-control, organizations, preferences, users, auth-data).
// IdentityModule only aggregates it with the presentation/application modules
// that are not covered there (AuthModule full, SSO).
@Module({
  imports: [IdentityPortsModule, AuthModule, SsoModule],
  exports: [IdentityPortsModule, AuthModule, SsoModule],
})
export class IdentityModule {}
