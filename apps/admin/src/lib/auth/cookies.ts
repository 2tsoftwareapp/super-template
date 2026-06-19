import { createAuthCookieHelpers } from "@repo/web-core/auth/cookies";

import { env, isSecureCookie } from "@/lib/env";

const auth = createAuthCookieHelpers({
  cookieDomain: env.COOKIE_DOMAIN,
  cookieSameSite: env.COOKIE_SAMESITE,
  cookieSecure: isSecureCookie,
  csrfSecret: env.CSRF_SECRET ?? null,
});

export const {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  createCsrfToken,
  isValidCsrfToken,
  readAuthCookies,
  setAuthCookies,
  clearAuthCookies,
} = {
  ACCESS_TOKEN_COOKIE: "st_access_token",
  REFRESH_TOKEN_COOKIE: "st_refresh_token",
  CSRF_TOKEN_COOKIE: "csrf_token",
  ...auth,
};
