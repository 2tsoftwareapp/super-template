import { createAuthCookieHelpers } from "@repo/web-core/auth/cookies";

import { env, isSecureCookie } from "@/lib/env";

export const ACCESS_TOKEN_COOKIE = "st_admin_access_token";
export const REFRESH_TOKEN_COOKIE = "st_admin_refresh_token";
export const CSRF_TOKEN_COOKIE = "st_admin_csrf";

const auth = createAuthCookieHelpers({
  cookieDomain: env.COOKIE_DOMAIN,
  cookieSameSite: env.COOKIE_SAMESITE,
  cookieSecure: isSecureCookie,
  csrfSecret: env.CSRF_SECRET ?? null,
  cookieNames: {
    accessToken: ACCESS_TOKEN_COOKIE,
    refreshToken: REFRESH_TOKEN_COOKIE,
    csrf: CSRF_TOKEN_COOKIE,
  },
  requireSignedCsrf:
    env.APP_ENV === "staging" || env.APP_ENV === "production",
});

export const {
  createCsrfToken,
  isValidCsrfToken,
  readAuthCookies,
  setAuthCookies,
  setCsrfCookie,
  clearAuthCookies,
} = auth;
