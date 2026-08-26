import { Module } from "@nestjs/common";

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
