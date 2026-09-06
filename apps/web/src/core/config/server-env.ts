import "server-only";
import { loadEnvFiles } from "@repo/env-loader";

import { webServerEnvSchema } from "./server-env.schema";

loadEnvFiles();

export { webServerEnvSchema } from "./server-env.schema";

export const serverEnv = webServerEnvSchema.parse({
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  WEB_ORIGIN: process.env.WEB_ORIGIN,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE,
  CSRF_SECRET: process.env.CSRF_SECRET,
  COOKIE_SECURE: process.env.COOKIE_SECURE,
  APP_ENV: process.env.APP_ENV,
  NODE_ENV: process.env.NODE_ENV,
});
