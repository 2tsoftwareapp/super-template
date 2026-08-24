import "server-only";

import { createAuthCookieHelpers } from "@repo/web-server/auth/cookies";

import {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/core/auth/cookie-names";
import { isSecureCookie, serverEnv } from "@/core/config/server-env";

export const authRuntime = createAuthCookieHelpers({
  cookieDomain: serverEnv.COOKIE_DOMAIN,
  cookieSameSite: serverEnv.COOKIE_SAMESITE,
  cookieSecure: isSecureCookie,
  csrfSecret: serverEnv.CSRF_SECRET ?? null,
  cookieNames: {
    accessToken: ACCESS_TOKEN_COOKIE,
    refreshToken: REFRESH_TOKEN_COOKIE,
    csrf: CSRF_TOKEN_COOKIE,
  },
  requireSignedCsrf:
    serverEnv.APP_ENV === "staging" || serverEnv.APP_ENV === "production",
});
