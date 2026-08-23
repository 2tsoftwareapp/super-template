import { Module } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-core";

import { AccessControlModule } from "../access-control";
import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { UsersModule } from "../users/users.module";
import {
  SSO_PROVIDER_REGISTRY,
  type SsoProviderAdapter,
} from "./application/ports/sso-provider.port";
import { SSO_REPOSITORY } from "./application/ports/sso.repository.port";
import { HandleSsoCallbackUseCase } from "./application/use-cases/handle-sso-callback.use-case";
import {
  CreateSsoSessionExchangeUseCase,
  ExchangeSsoSessionUseCase,
} from "./application/use-cases/sso-session-exchange.use-case";
import { StartSsoLoginUseCase } from "./application/use-cases/start-sso-login.use-case";
import { AppleSsoAdapter } from "./infrastructure/apple-sso.adapter";
import { FakeSsoAdapter } from "./infrastructure/fake-sso.adapter";
import { GithubSsoAdapter } from "./infrastructure/github-sso.adapter";
import { GoogleSsoAdapter } from "./infrastructure/google-sso.adapter";
import { JwksCacheService } from "./infrastructure/jwks-cache.service";
import { SsoRepository } from "./infrastructure/sso.repository";
import { SsoController } from "./presentation/sso.controller";

@Module({
  imports: [AccessControlModule, AuthModule, OrganizationsModule, UsersModule],
  controllers: [SsoController],
  providers: [
    SsoRepository,
    {
      provide: SSO_REPOSITORY,
      useExisting: SsoRepository,
    },
    JwksCacheService,
    GoogleSsoAdapter,
    AppleSsoAdapter,
    GithubSsoAdapter,
    FakeSsoAdapter,
    StartSsoLoginUseCase,
    HandleSsoCallbackUseCase,
    CreateSsoSessionExchangeUseCase,
    ExchangeSsoSessionUseCase,
    {
      provide: SSO_PROVIDER_REGISTRY,
      inject: [
        EnvironmentService,
        GoogleSsoAdapter,
        AppleSsoAdapter,
        GithubSsoAdapter,
        FakeSsoAdapter,
      ],
      useFactory: (
        environmentService: EnvironmentService,
        googleSsoAdapter: GoogleSsoAdapter,
        appleSsoAdapter: AppleSsoAdapter,
        githubSsoAdapter: GithubSsoAdapter,
        fakeSsoAdapter: FakeSsoAdapter,
      ) => {
        const registry = new Map<string, SsoProviderAdapter>();
        const { GOOGLE_CLIENT_ID, APPLE_CLIENT_ID, GITHUB_CLIENT_ID, SSO_FAKE_PROVIDER_ENABLED } =
          environmentService.values;

        if (GOOGLE_CLIENT_ID) {
          registry.set(googleSsoAdapter.provider, googleSsoAdapter);
        }

        if (APPLE_CLIENT_ID) {
          registry.set(appleSsoAdapter.provider, appleSsoAdapter);
        }

        if (GITHUB_CLIENT_ID) {
          registry.set(githubSsoAdapter.provider, githubSsoAdapter);
        }

        if (SSO_FAKE_PROVIDER_ENABLED && !environmentService.isProduction) {
          registry.set(fakeSsoAdapter.provider, fakeSsoAdapter);
        }

        return registry;
      },
    },
  ],
})
export class SsoModule {}
