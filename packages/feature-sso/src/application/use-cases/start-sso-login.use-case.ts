import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  durationToMilliseconds,
  generateOpaqueToken,
  hashOpaqueToken,
} from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import { SSO_ERROR_CODES } from "@repo/feature-sso/contracts";

import type { StartSsoLoginCommand } from "../sso.types";

import { computeCodeChallenge, generateCodeVerifier } from "../../domain/pkce";
import { assertAllowedRedirectUri } from "../../domain/redirect-allowlist";
import { SSO_PROVIDER_REGISTRY, type SsoProviderRegistry } from "../ports/sso-provider.port";
import { SSO_REPOSITORY, type SsoRepositoryPort } from "../ports/sso.repository.port";

const STATE_TTL = "10m";

@Injectable()
export class StartSsoLoginUseCase {
  constructor(
    @Inject(SSO_PROVIDER_REGISTRY)
    private readonly providers: SsoProviderRegistry,
    @Inject(SSO_REPOSITORY) private readonly ssoRepository: SsoRepositoryPort,
    private readonly environmentService: EnvironmentService,
  ) {}

  async execute(input: StartSsoLoginCommand): Promise<{ authorizationUrl: string }> {
    const provider = this.providers.get(input.provider);

    if (!provider) {
      throw new AppError(
        SSO_ERROR_CODES.SSO_PROVIDER_UNAVAILABLE,
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
