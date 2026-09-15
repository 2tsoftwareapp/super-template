import { Injectable } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-runtime";

import type {
  SsoIdentity,
  SsoProviderAdapter,
  SsoTokenSet,
} from "../application/ports/sso-provider.port";

import { buildAppleClientSecret } from "../domain/apple-client-secret";
import { verifyOidcIdToken } from "../domain/oidc-verify";
import { JwksCacheService } from "./jwks-cache.service";

const AUTHORIZATION_ENDPOINT = "https://appleid.apple.com/auth/authorize";
const TOKEN_ENDPOINT = "https://appleid.apple.com/auth/token";
const JWKS_URI = "https://appleid.apple.com/auth/keys";
const ISSUER = "https://appleid.apple.com";

@Injectable()
export class AppleSsoAdapter implements SsoProviderAdapter {
  readonly provider = "apple";

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly jwksCache: JwksCacheService,
  ) {}

  getCallbackRedirectUri(): string {
    const { APPLE_REDIRECT_URI, API_INTERNAL_URL } = this.environmentService.values;
    return APPLE_REDIRECT_URI ?? `${API_INTERNAL_URL}/api/v1/auth/sso/apple/callback`;
  }

  buildAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): Promise<string> {
    const url = new URL(AUTHORIZATION_ENDPOINT);
    url.searchParams.set("client_id", this.requireClientId());
    url.searchParams.set("redirect_uri", this.getCallbackRedirectUri());
    url.searchParams.set("response_type", "code");
    // Apple mandates response_mode=form_post whenever the "email"/"name" scopes are
    // requested, so the callback controller must accept a POST body, not just a GET query.
    url.searchParams.set("response_mode", "form_post");
    url.searchParams.set("scope", "name email");
    url.searchParams.set("state", params.state);
    url.searchParams.set("nonce", params.nonce);
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    // Apple (unlike the fake provider) keeps no server-side flow state.
    return Promise.resolve(url.toString());
  }

  async exchangeCode(params: { code: string; codeVerifier: string }): Promise<SsoTokenSet> {
    const { APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = this.environmentService.values;

    if (!APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) {
      throw new Error("Apple SSO is not configured");
    }

    const clientSecret = buildAppleClientSecret({
      teamId: APPLE_TEAM_ID,
      clientId: this.requireClientId(),
      keyId: APPLE_KEY_ID,
      privateKeyPem: APPLE_PRIVATE_KEY,
    });

    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.requireClientId(),
        client_secret: clientSecret,
        code: params.code,
        code_verifier: params.codeVerifier,
        redirect_uri: this.getCallbackRedirectUri(),
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Apple token exchange failed: ${response.status}`);
    }

    const body = (await response.json()) as { id_token?: string };

    if (!body.id_token) {
      throw new Error("Apple token response missing id_token");
    }

    return { idToken: body.id_token };
  }

  async verifyIdToken(idToken: string, nonce: string): Promise<SsoIdentity> {
    const jwks = await this.jwksCache.fetch(JWKS_URI);
    const payload = verifyOidcIdToken({
      idToken,
      jwks,
      issuers: [ISSUER],
      audience: this.requireClientId(),
      nonce,
    });

    return {
      subject: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      emailVerified: payload.email_verified === true || payload.email_verified === "true",
    };
  }

  private requireClientId(): string {
    const clientId = this.environmentService.values.APPLE_CLIENT_ID;

    if (!clientId) {
      throw new Error("Apple SSO is not configured");
    }

    return clientId;
  }
}
