import { loadEnvFiles } from "@repo/env-loader";

import { adminEnvSchema } from "./env.schema";

loadEnvFiles();

export { adminEnvSchema } from "./env.schema";

export const env = adminEnvSchema.parse({
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  ADMIN_ORIGIN: process.env.ADMIN_ORIGIN,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE,
  CSRF_SECRET: process.env.CSRF_SECRET,
  COOKIE_SECURE: process.env.COOKIE_SECURE,
  APP_ENV: process.env.APP_ENV,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.APP_ENV,
  NODE_ENV: process.env.NODE_ENV,
});

// Secure cookies on every deployed environment (staging + production), opt-in
// elsewhere via COOKIE_SECURE.
export const isSecureCookie =
  env.COOKIE_SECURE ?? (env.APP_ENV !== "development" && env.APP_ENV !== "test");
