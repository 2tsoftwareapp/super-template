import { Inject, Injectable } from "@nestjs/common";
import { durationToMilliseconds } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";

import type {
  SsoIdentity,
  SsoProviderAdapter,
  SsoTokenSet,
} from "../application/ports/sso-provider.port";
import type { SsoRepositoryPort } from "../application/ports/sso.repository.port";

import { SSO_REPOSITORY } from "../application/ports/sso.repository.port";

const AUTHORIZATION_ENDPOINT = "https://github.com/login/oauth/authorize";
const TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const USER_ENDPOINT = "https://api.github.com/user";
const EMAILS_ENDPOINT = "https://api.github.com/user/emails";

// GitHub does not consume the identity server-side until verifyIdToken runs,
// so the stored exchange only needs to cover that window (plus a crash/retry
// margin) — mirroring the session-exchange TTL.
const IDENTITY_EXCHANGE_TTL = "2m";

interface GithubUser {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
}

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

// GitHub OAuth2 provider. Uses the standard Authorization Code + PKCE flow.
// GitHub does not issue OIDC id_tokens, so identity is fetched from the /user
// and /user/emails APIs after the code exchange, then persisted in the SSO
// store (t_sso_login_states, encrypted at rest) behind a one-time handle. The
// handle doubles as the idToken and is CAS-consumed by verifyIdToken, so
// exchangeCode and verifyIdToken may run on different instances.
@Injectable()
export class GithubSsoAdapter implements SsoProviderAdapter {
  readonly provider = "github";

  constructor(
    @Inject(SSO_REPOSITORY) private readonly ssoRepository: SsoRepositoryPort,
    private readonly environmentService: EnvironmentService,
  ) {}

  getCallbackRedirectUri(): string {
    const { GITHUB_REDIRECT_URI, API_INTERNAL_URL } = this.environmentService.values;
    return GITHUB_REDIRECT_URI ?? `${API_INTERNAL_URL}/api/v1/auth/sso/github/callback`;
  }

  buildAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): Promise<string> {
    const url = new URL(AUTHORIZATION_ENDPOINT);
    url.searchParams.set("client_id", this.requireClientId());
    url.searchParams.set("redirect_uri", this.getCallbackRedirectUri());
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", params.state);
    // PKCE is supported by GitHub OAuth apps (introduced 2023).
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    // The identity exchange is stored during exchangeCode, not here.
    return Promise.resolve(url.toString());
  }

  async exchangeCode(params: { code: string; codeVerifier: string }): Promise<SsoTokenSet> {
    const { GITHUB_CLIENT_SECRET } = this.environmentService.values;

    if (!GITHUB_CLIENT_SECRET) {
      throw new Error("GitHub SSO is not configured");
    }

    const tokenResponse = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.requireClientId(),
        client_secret: GITHUB_CLIENT_SECRET,
        code: params.code,
        redirect_uri: this.getCallbackRedirectUri(),
        code_verifier: params.codeVerifier,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenResponse.status}`);
    }

    const tokenBody = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenBody.access_token) {
      throw new Error(
        tokenBody.error
          ? `GitHub token exchange error: ${tokenBody.error}`
          : "GitHub token response missing access_token",
      );
    }

    const accessToken = tokenBody.access_token;

    const [userResponse, emailsResponse] = await Promise.all([
      fetch(USER_ENDPOINT, {
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: "application/vnd.github+json",
        },
      }),
      fetch(EMAILS_ENDPOINT, {
        headers: {
          authorization: `Bearer ${accessToken}`,
          accept: "application/vnd.github+json",
        },
      }),
    ]);

    if (!userResponse.ok) {
      throw new Error(`GitHub user fetch failed: ${userResponse.status}`);
    }

    const user = (await userResponse.json()) as GithubUser;
    const emails = emailsResponse.ok ? ((await emailsResponse.json()) as GithubEmail[]) : [];

    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ??
      emails.find((e) => e.primary)?.email ??
      user.email ??
      null;

    if (!primaryEmail) {
      throw new Error(
        "GitHub account has no verified primary email. Enable email visibility in your GitHub account settings.",
      );
    }

    const emailVerified = emails.find((e) => e.email === primaryEmail)?.verified ?? false;

    // GitHub ignores the OIDC nonce (no id_token), so the stored exchange
    // carries an empty nonce and verifyIdToken does not compare it.
    const handle = await this.ssoRepository.storeIdentityExchange({
      provider: this.provider,
      identity: {
        subject: `github:${user.id}`,
        email: primaryEmail,
        emailVerified,
      },
      nonce: "",
      expiresAt: new Date(Date.now() + durationToMilliseconds(IDENTITY_EXCHANGE_TTL)),
    });

    // The opaque handle doubles as the idToken; verifyIdToken retrieves the
    // identity from the store exactly once.
    return { idToken: handle };
  }

  async verifyIdToken(idToken: string, _nonce: string): Promise<SsoIdentity> {
    const record = await this.ssoRepository.consumeIdentityExchange(idToken);

    if (!record) {
      throw new Error("GitHub identity not found or already consumed");
    }

    return record.identity;
  }

  private requireClientId(): string {
    const clientId = this.environmentService.values.GITHUB_CLIENT_ID;

    if (!clientId) {
      throw new Error("GitHub SSO is not configured");
    }

    return clientId;
  }
}
