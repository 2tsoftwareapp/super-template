import { z } from "zod";

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

export const webServerEnvSchema = z
  .object({
    API_INTERNAL_URL: z.url(),
    WEB_ORIGIN: z.string().min(1),
    COOKIE_DOMAIN: emptyStringToUndefined,
    COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
    CSRF_SECRET: emptyStringToUndefined,
    COOKIE_SECURE: booleanFromString.optional(),
    APP_ENV: appEnvSchema,
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .superRefine((env, ctx) => {
    const isDeployed = env.APP_ENV === "staging" || env.APP_ENV === "production";
    if (isDeployed && (!env.CSRF_SECRET || env.CSRF_SECRET.length < 24)) {
      ctx.addIssue({
        code: "custom",
        path: ["CSRF_SECRET"],
        message: "required (min 24 characters) in staging/production for signed CSRF cookies",
      });
    }
  });
