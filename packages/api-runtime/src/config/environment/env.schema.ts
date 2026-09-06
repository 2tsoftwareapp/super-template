import { z } from "zod";

import {
  booleanFromString,
  commaSeparatedOrigins,
  durationString,
  emptyStringToUndefined,
  everyOriginIsHttps,
  optionalEmail,
  optionalSecretMin,
} from "./env-utils";
import { DEV_PLACEHOLDER_MFA_KEY, DEV_PLACEHOLDER_SECRETS } from "./env.constants";

export const envSchema = z
  .object({
    // Environment and process metadata.
    APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
    // PostgreSQL connection settings used by the database layer and migration scripts.
    POSTGRES_HOST: z.string().min(1),
    POSTGRES_PORT: z.coerce.number().int().positive(),
    POSTGRES_DB: z.string().min(1),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    DATABASE_URL: z.url(),
    DATABASE_MIGRATE_URL: emptyStringToUndefined,
    DATABASE_SKIP_RLS_CHECK: booleanFromString.default(false),
    // Only required when APP_ENV=test (enforced by the superRefine below); production
    // and dev boots (e.g. the Playwright API server) must not need a test database URL.
    DATABASE_URL_TEST: z.url().optional(),
    DATABASE_URL_TEST_ADMIN: emptyStringToUndefined,
    // Public and internal HTTP endpoints.
    API_PORT: z.coerce.number().int().positive().default(3001),
    // Global URL prefix for all API routes (e.g. "api/v1"). Kept configurable so
    // deployed environments can mount the service under a different base path.
    API_GLOBAL_PREFIX: z.string().min(1).default("api/v1"),
    // Shared throttler window/limit across all routes (60s / 120 requests by default).
    THROTTLER_TTL_MS: z.coerce.number().int().positive().default(60_000),
    THROTTLER_LIMIT: z.coerce.number().int().positive().default(120),
    // Max JSON/urlencoded request body size accepted by Express (e.g. "1mb", "500kb").
    API_BODY_LIMIT: z
      .string()
      .regex(/^\d+(b|kb|mb|gb)$/i, 'must be a size like "1mb" or "500kb"')
      .default("1mb"),
    WEB_PORT: z.coerce.number().int().positive(),
    WEB_ORIGIN: commaSeparatedOrigins,
    // Admin app origin(s) for SSO post-login redirects and CORS-adjacent allowlists.
    ADMIN_ORIGIN: z.preprocess(
      (value) => (value === "" ? undefined : value),
      commaSeparatedOrigins.optional(),
    ),
    // Exact redirect URIs for native deep links (e.g. myapp://sso/callback).
    SSO_REDIRECT_URIS: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().optional(),
    ),
    API_INTERNAL_URL: z.url(),
    NEXT_PUBLIC_WEB_URL: z.url(),
    NEXT_PUBLIC_API_BASE_PATH: z.string().min(1).default("/api"),
    // Optional Redis endpoint for shared throttling, cache, and fan-out. Leave empty to keep single-instance behavior.
    REDIS_URL: emptyStringToUndefined,
    // Required in production for distributed rate limiting and shared access-profile cache.
    // Uses in-process memory when REDIS_URL is unset (development/test only).
    ACCESS_PROFILE_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    // TTL for application-settings flag lookups (maintenance mode, registration
    // enabled). Redis-backed in production so toggles propagate across instances.
    SETTINGS_LOOKUP_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(5),
    // Optional error-reporting sinks. Sentry stores structured exceptions; Telegram sends human alerts.
    SENTRY_DSN: emptyStringToUndefined,
    SENTRY_ENVIRONMENT: emptyStringToUndefined,
    SENTRY_RELEASE: emptyStringToUndefined,
    TELEGRAM_ERROR_BOT_TOKEN: emptyStringToUndefined,
    TELEGRAM_ERROR_BOT_CHAT_ID: emptyStringToUndefined,
    TELEGRAM_ERROR_BOT_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
    // Token signing secrets and TTLs.
    JWT_ACCESS_SECRET: z.string().min(24),
    JWT_REFRESH_SECRET: z.string().min(24),
    JWT_ACCESS_TTL: durationString,
    JWT_REFRESH_TTL: durationString,
    // Symmetric key (32 bytes, hex-encoded) used to encrypt TOTP secrets at rest with AES-256-GCM.
    MFA_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, "must be a 64-character hex string (32 bytes)"),
    // Days to retain audit_logs rows before the daily purge job deletes them. 0 disables purging.
    AUDIT_RETENTION_DAYS: z.coerce.number().int().min(0).default(0),
    // SSO providers (OIDC Authorization Code + PKCE). Leave a provider's client id unset to
    // disable it; the redirect URI defaults to API_INTERNAL_URL + the provider callback path.
    GOOGLE_CLIENT_ID: emptyStringToUndefined,
    GOOGLE_CLIENT_SECRET: emptyStringToUndefined,
    GOOGLE_REDIRECT_URI: emptyStringToUndefined,
    APPLE_CLIENT_ID: emptyStringToUndefined,
    APPLE_TEAM_ID: emptyStringToUndefined,
    APPLE_KEY_ID: emptyStringToUndefined,
    APPLE_PRIVATE_KEY: emptyStringToUndefined,
    APPLE_REDIRECT_URI: emptyStringToUndefined,
    // GitHub OAuth2 (Authorization Code + PKCE). Set GITHUB_CLIENT_ID to enable.
    GITHUB_CLIENT_ID: emptyStringToUndefined,
    GITHUB_CLIENT_SECRET: emptyStringToUndefined,
    GITHUB_REDIRECT_URI: emptyStringToUndefined,
    // Registers an in-memory mock SSO provider (provider key "fake") for local/dev/test use
    // without real OAuth credentials. Refused outside of development/test at startup.
    SSO_FAKE_PROVIDER_ENABLED: booleanFromString.default(false),
    // Mail transport and local Mailpit access.
    MAIL_HOST: z.string().min(1),
    MAIL_PORT: z.coerce.number().int().positive(),
    MAIL_FROM: z.email(),
    MAILPIT_HTTP_PORT: z.coerce.number().int().positive().default(8025),
    // Docker/test harness ports and demo toggles.
    POSTGRES_EXPOSED_PORT: z.coerce.number().int().positive().default(5432),
    API_DOCS_ENABLED: booleanFromString.default(true),
    COOKIE_SECURE: booleanFromString.default(false),
    COOKIE_DOMAIN: emptyStringToUndefined,
    COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
    // Seed credentials are CLI/bootstrap only — optional so staging/production can boot
    // without them. `db:seed` still requires all four (checked in the users seeder).
    SEED_ADMIN_EMAIL: optionalEmail,
    SEED_ADMIN_PASSWORD: optionalSecretMin(8),
    SEED_USER_EMAIL: optionalEmail,
    SEED_USER_PASSWORD: optionalSecretMin(8),
    // Optional Firebase credentials for push notification delivery.
    FCM_PROJECT_ID: emptyStringToUndefined,
    FCM_CLIENT_EMAIL: emptyStringToUndefined,
    FCM_PRIVATE_KEY: emptyStringToUndefined,
    // Object storage configuration for file uploads and generated artifacts.
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    STORAGE_LOCAL_PATH: z.string().min(1).default("./storage"),
    S3_BUCKET: emptyStringToUndefined,
    S3_REGION: emptyStringToUndefined,
    S3_ACCESS_KEY_ID: emptyStringToUndefined,
    S3_SECRET_ACCESS_KEY: emptyStringToUndefined,
    S3_ENDPOINT: emptyStringToUndefined,
  })
  .superRefine((env, ctx) => {
    if (env.APP_ENV === "test" && !env.DATABASE_URL_TEST) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL_TEST"],
        message: "DATABASE_URL_TEST is required when APP_ENV=test",
      });
    }

    if (env.APP_ENV === "production" && env.SSO_FAKE_PROVIDER_ENABLED) {
      ctx.addIssue({
        code: "custom",
        path: ["SSO_FAKE_PROVIDER_ENABLED"],
        message: "SSO_FAKE_PROVIDER_ENABLED must not be enabled in production",
      });
    }

    // Deployed environments (staging + production) must not reuse the development
    // placeholder secrets that ship with the template.
    const isDeployed = env.APP_ENV === "staging" || env.APP_ENV === "production";
    if (isDeployed) {
      if (env.DATABASE_SKIP_RLS_CHECK) {
        ctx.addIssue({
          code: "custom",
          path: ["DATABASE_SKIP_RLS_CHECK"],
          message: "must be false in staging/production",
        });
      }
      if (DEV_PLACEHOLDER_SECRETS.has(env.JWT_ACCESS_SECRET)) {
        ctx.addIssue({
          code: "custom",
          path: ["JWT_ACCESS_SECRET"],
          message: "must not reuse the development placeholder secret in staging/production",
        });
      }
      if (DEV_PLACEHOLDER_SECRETS.has(env.JWT_REFRESH_SECRET)) {
        ctx.addIssue({
          code: "custom",
          path: ["JWT_REFRESH_SECRET"],
          message: "must not reuse the development placeholder secret in staging/production",
        });
      }
      if (env.MFA_ENCRYPTION_KEY === DEV_PLACEHOLDER_MFA_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["MFA_ENCRYPTION_KEY"],
          message: "must not reuse the development placeholder key in staging/production",
        });
      }
    }

    // Deployed environments must serve over HTTPS with secure cookies.
    if (isDeployed) {
      if (!env.COOKIE_SECURE) {
        ctx.addIssue({
          code: "custom",
          path: ["COOKIE_SECURE"],
          message: "must be true in staging/production",
        });
      }
      if (!everyOriginIsHttps(env.WEB_ORIGIN)) {
        ctx.addIssue({
          code: "custom",
          path: ["WEB_ORIGIN"],
          message: "must use https in staging/production",
        });
      }
      if (!env.NEXT_PUBLIC_WEB_URL.startsWith("https://")) {
        ctx.addIssue({
          code: "custom",
          path: ["NEXT_PUBLIC_WEB_URL"],
          message: "must use https in staging/production",
        });
      }
      if (env.ADMIN_ORIGIN && !everyOriginIsHttps(env.ADMIN_ORIGIN)) {
        ctx.addIssue({
          code: "custom",
          path: ["ADMIN_ORIGIN"],
          message: "must use https in staging/production when set",
        });
      }
      if (env.STORAGE_DRIVER === "local") {
        ctx.addIssue({
          code: "custom",
          path: ["STORAGE_DRIVER"],
          message: "must be s3 in staging/production (local filesystem is not durable)",
        });
      }
      if (env.STORAGE_DRIVER === "s3" && !env.S3_BUCKET) {
        ctx.addIssue({
          code: "custom",
          path: ["S3_BUCKET"],
          message: "required when STORAGE_DRIVER=s3",
        });
      }
    }
  });

export type AppEnvironment = z.infer<typeof envSchema>;

export const validateEnvironment = (input: Record<string, unknown>): AppEnvironment => {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables: ${details}`);
  }

  return result.data;
};
