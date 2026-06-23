import { Injectable } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core';

import type {
  SsoIdentity,
  SsoProviderAdapter,
  SsoTokenSet,
} from '../ports/sso-provider.port';

import { verifyOidcIdToken } from '../domain/oidc-verify';
import { JwksCacheService } from '../infrastructure/jwks-cache.service';

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';
// Google has issued tokens with both forms historically; accept either.
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

@Injectable()
export class GoogleSsoProvider implements SsoProviderAdapter {
  readonly provider = 'google';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly jwksCache: JwksCacheService,
  ) {}

  getCallbackRedirectUri(): string {
    const { GOOGLE_REDIRECT_URI, API_INTERNAL_URL } =
      this.environmentService.values;
    return (
      GOOGLE_REDIRECT_URI ??
      `${API_INTERNAL_URL}/api/v1/auth/sso/google/callback`
    );
  }

  buildAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
  }): string {
    const url = new URL(AUTHORIZATION_ENDPOINT);
    url.searchParams.set('client_id', this.requireClientId());
    url.searchParams.set('redirect_uri', this.getCallbackRedirectUri());
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', params.state);
    url.searchParams.set('nonce', params.nonce);
    url.searchParams.set('code_challenge', params.codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    return url.toString();
  }

  async exchangeCode(params: {
    code: string;
    codeVerifier: string;
  }): Promise<SsoTokenSet> {
    const { GOOGLE_CLIENT_SECRET } = this.environmentService.values;

    if (!GOOGLE_CLIENT_SECRET) {
      throw new Error('Google SSO is not configured');
    }

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.requireClientId(),
        client_secret: GOOGLE_CLIENT_SECRET,
        code: params.code,
        code_verifier: params.codeVerifier,
        redirect_uri: this.getCallbackRedirectUri(),
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Google token exchange failed: ${response.status}`);
    }

    const body = (await response.json()) as { id_token?: string };

    if (!body.id_token) {
      throw new Error('Google token response missing id_token');
    }

    return { idToken: body.id_token };
  }

  async verifyIdToken(idToken: string, nonce: string): Promise<SsoIdentity> {
    const jwks = await this.jwksCache.fetch(JWKS_URI);
    const payload = verifyOidcIdToken({
      idToken,
      jwks,
      issuers: ISSUERS,
      audience: this.requireClientId(),
      nonce,
    });

    return {
      subject: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      emailVerified:
        payload.email_verified === true ||
        payload.email_verified === 'true',
    };
  }

  private requireClientId(): string {
    const clientId = this.environmentService.values.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error('Google SSO is not configured');
    }

    return clientId;
  }
}
