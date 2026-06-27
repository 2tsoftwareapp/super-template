import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  durationToMilliseconds,
  EnvironmentService,
  ERROR_CODES,
  generateOpaqueToken,
  hashOpaqueToken,
} from '@repo/api-core';

import type { StartSsoLoginCommand } from '../sso.types';

import { computeCodeChallenge, generateCodeVerifier } from '../../domain/pkce';
import { assertAllowedRedirectUri } from '../../domain/redirect-allowlist';
import { SsoRepository } from '../../infrastructure/sso.repository';
import {
  SSO_PROVIDER_REGISTRY,
  type SsoProviderRegistry,
} from '../../ports/sso-provider.port';

const STATE_TTL = '10m';

@Injectable()
export class StartSsoLoginUseCase {
  constructor(
    @Inject(SSO_PROVIDER_REGISTRY)
    private readonly providers: SsoProviderRegistry,
    private readonly ssoRepository: SsoRepository,
    private readonly environmentService: EnvironmentService,
  ) {}

  async execute(
    input: StartSsoLoginCommand,
  ): Promise<{ authorizationUrl: string }> {
    const provider = this.providers.get(input.provider);

    if (!provider) {
      throw new AppError(
        ERROR_CODES.SSO_PROVIDER_UNAVAILABLE,
        `SSO provider "${input.provider}" is not available`,
        HttpStatus.NOT_FOUND,
      );
    }

    assertAllowedRedirectUri(
      input.redirectUri,
      this.environmentService.ssoRedirectOrigins,
      this.environmentService.ssoRedirectUris,
    );

    const state = generateOpaqueToken();
    const nonce = generateOpaqueToken();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = computeCodeChallenge(codeVerifier);

    await this.ssoRepository.createLoginState({
      provider: provider.provider,
      stateHash: hashOpaqueToken(state),
      nonce,
      codeVerifier,
      redirectUri: input.redirectUri,
      expiresAt: new Date(Date.now() + durationToMilliseconds(STATE_TTL)),
    });

    const authorizationUrl = provider.buildAuthorizationUrl({
      state,
      nonce,
      codeChallenge,
      ...(input.testEmail !== undefined ? { testEmail: input.testEmail } : {}),
    });

    return { authorizationUrl };
  }
}
