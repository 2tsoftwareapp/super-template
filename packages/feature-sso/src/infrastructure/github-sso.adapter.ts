import { Injectable } from "@nestjs/common";
import { EnvironmentService, generateOpaqueToken } from "@repo/api-runtime";

import type {
  SsoIdentity,
  SsoProviderAdapter,
  SsoTokenSet,
} from "../application/ports/sso-provider.port";

const AUTHORIZATION_ENDPOINT = "https://github.com/login/oauth/authorize";
const TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const USER_ENDPOINT = "https://api.github.com/user";
const EMAILS_ENDPOINT = "https://api.github.com/user/emails";

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

interface StoredIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
}

// GitHub OAuth2 provider. Uses the standard Authorization Code + PKCE flow.
// GitHub does not issue OIDC id_tokens, so identity is fetched from the /user
// and /user/emails APIs after the code exchange, then stored in process memory
// for the duration of the callback round-trip (seconds).
@Injectable()
export class GithubSsoAdapter implements SsoProviderAdapter {
  readonly provider = "github";

  private readonly pendingIdentities = new Map<string, StoredIdentity>();

  constructor(private readonly environmentService: EnvironmentService) {}

  getCallbackRedirectUri(): string {
    const { GITHUB_REDIRECT_URI, API_INTERNAL_URL } = this.environmentService.values;
    return GITHUB_REDIRECT_URI ?? `${API_INTERNAL_URL}/api/v1/auth/sso/github/callback`;
  }

  buildAuthorizationUrl(params: { state: string; nonce: string; codeChallenge: string }): string {
    const url = new URL(AUTHORIZATION_ENDPOINT);
    url.searchParams.set("client_id", this.requireClientId());
    url.searchParams.set("redirect_uri", this.getCallbackRedirectUri());
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", params.state);
    // PKCE is supported by GitHub OAuth apps (introduced 2023).
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    return url.toString();
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

    const opaque = generateOpaqueToken();
    this.pendingIdentities.set(opaque, {
      subject: `github:${user.id}`,
      email: primaryEmail,
      emailVerified,
    });

    // The opaque token doubles as the idToken handle; verifyIdToken retrieves it.
    return { idToken: opaque };
  }

  verifyIdToken(idToken: string, _nonce: string): Promise<SsoIdentity> {
    const identity = this.pendingIdentities.get(idToken);

    if (!identity) {
      throw new Error("GitHub identity not found or already consumed");
    }

    this.pendingIdentities.delete(idToken);

    return Promise.resolve(identity);
  }

  private requireClientId(): string {
    const clientId = this.environmentService.values.GITHUB_CLIENT_ID;

    if (!clientId) {
      throw new Error("GitHub SSO is not configured");
    }

    return clientId;
  }
}
