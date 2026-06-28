import { createAuthCookieHelpers } from "@repo/web-core/auth/cookies";

import {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookie-names";
import { env, isSecureCookie } from "@/lib/env";

export {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookie-names";

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
