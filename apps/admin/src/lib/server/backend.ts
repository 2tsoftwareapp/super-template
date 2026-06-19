import { createAuthCookieHelpers } from "@repo/web-core/auth/cookies";
import { createBackendHelpers } from "@repo/web-core/server";

import { env } from "@/lib/env";

const auth = createAuthCookieHelpers({
  cookieDomain: env.COOKIE_DOMAIN,
  cookieSameSite: env.COOKIE_SAMESITE,
  cookieSecure: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
  csrfSecret: env.CSRF_SECRET ?? null,
});

const backend = createBackendHelpers({
  apiInternalUrl: env.API_INTERNAL_URL,
  allowedOrigins: [env.ADMIN_ORIGIN],
  auth,
});

export const { callBackend, refreshSession, enforceCsrf, proxyWithRefresh } =
  backend;
