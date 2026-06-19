import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

loadEnv({ path: resolve(process.cwd(), ".env"), quiet: true });
loadEnv({ path: resolve(process.cwd(), ".env.example"), quiet: true });
loadEnv({ path: resolve(process.cwd(), "../../.env"), quiet: true });
loadEnv({ path: resolve(process.cwd(), "../../.env.example"), quiet: true });

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
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse({
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  ADMIN_ORIGIN: process.env.ADMIN_ORIGIN,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE,
  CSRF_SECRET: process.env.CSRF_SECRET,
  COOKIE_SECURE: process.env.COOKIE_SECURE,
  NODE_ENV: process.env.NODE_ENV,
});

export const isSecureCookie =
  env.COOKIE_SECURE ?? env.NODE_ENV === "production";
