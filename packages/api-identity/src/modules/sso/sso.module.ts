import { Module } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core';

import { AccessControlModule } from '../access-control/access-control.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { SsoService } from './application/sso.service';
import { HandleSsoCallbackUseCase } from './application/use-cases/handle-sso-callback.use-case';
import { StartSsoLoginUseCase } from './application/use-cases/start-sso-login.use-case';
import { JwksCacheService } from './infrastructure/jwks-cache.service';
import { SsoRepository } from './infrastructure/sso.repository';
import {
  SSO_PROVIDER_REGISTRY,
  type SsoProviderAdapter,
} from './ports/sso-provider.port';
import { SsoController } from './presentation/sso.controller';
import { AppleSsoProvider } from './providers/apple-sso.provider';
import { FakeSsoProvider } from './providers/fake-sso.provider';
import { GoogleSsoProvider } from './providers/google-sso.provider';

@Module({
  imports: [AccessControlModule, AuthModule, OrganizationsModule, UsersModule],
  controllers: [SsoController],
  providers: [
    SsoRepository,
    JwksCacheService,
    GoogleSsoProvider,
    AppleSsoProvider,
    FakeSsoProvider,
    SsoService,
    StartSsoLoginUseCase,
    HandleSsoCallbackUseCase,
    {
      provide: SSO_PROVIDER_REGISTRY,
      inject: [
        EnvironmentService,
        GoogleSsoProvider,
        AppleSsoProvider,
        FakeSsoProvider,
      ],
      useFactory: (
        environmentService: EnvironmentService,
        googleSsoProvider: GoogleSsoProvider,
        appleSsoProvider: AppleSsoProvider,
        fakeSsoProvider: FakeSsoProvider,
      ) => {
        const registry = new Map<string, SsoProviderAdapter>();
        const { GOOGLE_CLIENT_ID, APPLE_CLIENT_ID, SSO_FAKE_PROVIDER_ENABLED } =
          environmentService.values;

        if (GOOGLE_CLIENT_ID) {
          registry.set(googleSsoProvider.provider, googleSsoProvider);
        }

        if (APPLE_CLIENT_ID) {
          registry.set(appleSsoProvider.provider, appleSsoProvider);
        }

        if (SSO_FAKE_PROVIDER_ENABLED && !environmentService.isProduction) {
          registry.set(fakeSsoProvider.provider, fakeSsoProvider);
        }

        return registry;
      },
    },
  ],
  exports: [SsoService],
})
export class SsoModule {}
