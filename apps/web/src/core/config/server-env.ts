import { loadEnvFiles } from "@repo/env-loader";
import { z } from "zod";

loadEnvFiles();

const appEnvSchema = z
  .enum(["development", "test", "staging", "production"])
  .default("development");

const booleanFromString = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const emptyStringToUndefined = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const serverEnvSchema = z.object({
  API_INTERNAL_URL: z.url(),
  WEB_ORIGIN: z.string().min(1),
  COOKIE_DOMAIN: emptyStringToUndefined,
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  CSRF_SECRET: emptyStringToUndefined,
  COOKIE_SECURE: booleanFromString.optional(),
  APP_ENV: appEnvSchema,
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const serverEnv = serverEnvSchema.parse({
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  WEB_ORIGIN: process.env.WEB_ORIGIN,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE,
  CSRF_SECRET: process.env.CSRF_SECRET,
  COOKIE_SECURE: process.env.COOKIE_SECURE,
  APP_ENV: process.env.APP_ENV,
  NODE_ENV: process.env.NODE_ENV,
});

export const isSecureCookie =
  serverEnv.COOKIE_SECURE ??
  (serverEnv.APP_ENV !== "development" && serverEnv.APP_ENV !== "test");
