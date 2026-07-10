export const SSO_PROVIDERS = {
  apple: "apple",
  google: "google",
} as const;

export type SsoProvider = (typeof SSO_PROVIDERS)[keyof typeof SSO_PROVIDERS];

const authBasePath = "/api/auth";

function withQuery(path: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export const apiPaths = {
  auth: {
    login: `${authBasePath}/login`,
    logout: `${authBasePath}/logout`,
    mfaVerifyChallenge: `${authBasePath}/mfa/verify-challenge`,
    session: `${authBasePath}/session`,
    ssoEstablishSession: `${authBasePath}/sso/establish-session`,
    ssoStart: (provider: SsoProvider, redirectUri: string) =>
      withQuery(`${authBasePath}/sso/${provider}/start`, { redirectUri }),
  },
} as const;
