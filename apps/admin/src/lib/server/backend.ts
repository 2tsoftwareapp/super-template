import { createAuthCookieHelpers } from "@repo/web-server/auth/cookies";
import { createBackendHelpers } from "@repo/web-server/server";

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
  allowedOrigins: [env.ADMIN_ORIGIN],
  auth,
});

export const {
  callBackend,
  readAuthCookies,
  refreshSession,
  enforceOrigin,
  enforceCsrf,
  enforceMutationGuard,
  proxyWithRefresh,
} = backend;
