export interface SsoTokenSet {
  idToken: string;
}

export interface SsoIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
}

export interface SsoProviderAdapter {
  readonly provider: string;

  /** The fixed redirect_uri registered with the provider for this deployment. */
  getCallbackRedirectUri(): string;

  /**
   * Build the provider authorization URL for a fresh login. Async because some
   * providers persist server-side flow state (e.g. the fake provider stores the
   * issued code in the SSO store so callbacks work across instances).
   */
  buildAuthorizationUrl(params: {
    state: string;
    nonce: string;
    codeChallenge: string;
    /** Only honored by the fake/test provider; real providers ignore it. */
    testEmail?: string;
  }): Promise<string>;

  exchangeCode(params: { code: string; codeVerifier: string }): Promise<SsoTokenSet>;

  verifyIdToken(idToken: string, nonce: string): Promise<SsoIdentity>;
}

export const SSO_PROVIDER_REGISTRY = Symbol("SSO_PROVIDER_REGISTRY");

export type SsoProviderRegistry = ReadonlyMap<string, SsoProviderAdapter>;
