import { createAuthCookieHelpers } from "@repo/web-core/auth/cookies";
import { createBackendHelpers } from "@repo/web-core/server";

import {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookie-names";
import { env, isSecureCookie } from "@/lib/env";

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

const backend = createBackendHelpers({
  apiInternalUrl: env.API_INTERNAL_URL,
  allowedOrigins: env.WEB_ORIGIN.split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  auth,
});

export const {
  callBackend,
  refreshSession,
  enforceOrigin,
  enforceCsrf,
  enforceMutationGuard,
  proxyWithRefresh,
} = backend;
