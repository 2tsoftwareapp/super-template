import "server-only";

import { serverEnv } from "./server-env";

const allowedOrigins = serverEnv.WEB_ORIGIN.split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const cookieSecure =
  serverEnv.COOKIE_SECURE ??
  (serverEnv.APP_ENV !== "development" && serverEnv.APP_ENV !== "test");

const requireSignedCsrf =
  serverEnv.APP_ENV === "staging" || serverEnv.APP_ENV === "production";

export const serverConfig = {
  backend: {
    apiInternalUrl: serverEnv.API_INTERNAL_URL,
    allowedOrigins,
  },
  auth: {
    cookieDomain: serverEnv.COOKIE_DOMAIN,
    cookieSameSite: serverEnv.COOKIE_SAMESITE,
    cookieSecure,
    csrfSecret: serverEnv.CSRF_SECRET ?? null,
    requireSignedCsrf,
  },
} as const;
