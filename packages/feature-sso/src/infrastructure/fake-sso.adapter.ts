import { Inject, Injectable } from "@nestjs/common";
import { durationToMilliseconds, generateOpaqueToken } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";

import type {
  SsoIdentity,
  SsoProviderAdapter,
  SsoTokenSet,
} from "../application/ports/sso-provider.port";
import type { SsoRepositoryPort } from "../application/ports/sso.repository.port";

import { SSO_REPOSITORY } from "../application/ports/sso.repository.port";

// Matches the login-state TTL in StartSsoLoginUseCase: the issued code must
// stay redeemable for as long as its login state is valid.
const FAKE_IDENTITY_EXCHANGE_TTL = "10m";

// Stand-in for a real OIDC provider so the full start -> callback -> session
// flow can be exercised in dev/E2E without live Google/Apple credentials. The
// issued code is persisted in the SSO store (t_sso_login_states, encrypted at
// rest) behind a CAS-consumed handle, so start and callback may run on
// different instances. Never registered when APP_ENV=production (enforced at
// env-validation time and at module wiring).
@Injectable()
export class FakeSsoAdapter implements SsoProviderAdapter {
  readonly provider = "fake";

  constructor(
    @Inject(SSO_REPOSITORY) private readonly ssoRepository: SsoRepositoryPort,
    private readonly environmentService: EnvironmentService,
  ) {}

  getCallbackRedirectUri(): string {
    return `${this.environmentService.values.API_INTERNAL_URL}/api/v1/auth/sso/fake/callback`;
  }

  async buildAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
    testEmail?: string;
  }): Promise<string> {
    const seed = generateOpaqueToken().slice(0, 12);
    const code = await this.ssoRepository.storeIdentityExchange({
      provider: this.provider,
      identity: {
        subject: `fake-subject-${seed}`,
        email: params.testEmail ?? `fake-user-${seed}@example.test`,
        emailVerified: true,
      },
      nonce: params.nonce,
      expiresAt: new Date(Date.now() + durationToMilliseconds(FAKE_IDENTITY_EXCHANGE_TTL)),
    });

    const url = new URL(this.getCallbackRedirectUri());
    url.searchParams.set("code", code);
    url.searchParams.set("state", params.state);
    return url.toString();
  }

  // The fake "code" is the one-time handle into the store; the actual
  // consume happens in verifyIdToken so an unknown code still fails the
  // callback (one step later, same error envelope).
  exchangeCode(params: { code: string; codeVerifier: string }): Promise<SsoTokenSet> {
    return Promise.resolve({ idToken: params.code });
  }

  async verifyIdToken(idToken: string, nonce: string): Promise<SsoIdentity> {
    const issued = await this.ssoRepository.consumeIdentityExchange(idToken);

    if (!issued) {
      throw new Error("Unknown fake id token");
    }

    if (issued.nonce !== nonce) {
      throw new Error("Nonce mismatch");
    }

    return issued.identity;
  }
}
