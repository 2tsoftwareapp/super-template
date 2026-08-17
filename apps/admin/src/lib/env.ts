import { loadEnvFiles } from "@repo/env-loader";
import { z } from "zod";

loadEnvFiles();

const appEnvSchema = z
  .enum(["development", "test", "staging", "production"])
  .default("development");

const booleanFromString = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }
  }

  return value;
}, z.boolean());

const emptyStringToUndefined = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const envSchema = z.object({
  API_INTERNAL_URL: z.url(),
  ADMIN_ORIGIN: z.url(),
  COOKIE_DOMAIN: emptyStringToUndefined,
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  CSRF_SECRET: emptyStringToUndefined,
  COOKIE_SECURE: booleanFromString.optional(),
  APP_ENV: appEnvSchema,
  NEXT_PUBLIC_APP_ENV: appEnvSchema,
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse({
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
