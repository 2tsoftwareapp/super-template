import { z } from 'zod';

const booleanFromString = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean());

const emptyStringToUndefined = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);

const isHttpUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// Accepts one origin or a comma-separated list, validating each entry as a URL.
const commaSeparatedOrigins = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .every(isHttpUrl),
    { message: 'must be a comma-separated list of valid origin URLs' },
  );

// Matches the format accepted by durationToMilliseconds (e.g. "15m", "7d").
const durationString = z
  .string()
  .regex(/^\d+[smhdw]$/, 'must be a duration like "15m" or "7d"');

// Placeholder secrets shipped in .env.example / .env.development. They are fine for
// local development but MUST be replaced with real secrets in staging/production.
const DEV_PLACEHOLDER_SECRETS = new Set([
  'replace-with-a-long-random-development-secret',
  'replace-with-another-long-random-development-secret',
]);
const DEV_PLACEHOLDER_MFA_KEY =
  '0861abb090792515d50d973600fced671ad99f2edd463d5da88887d90d594f99';

const everyOriginIsHttps = (value: string): boolean =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .every((origin) => origin.startsWith('https://'));

export const envSchema = z.object({
  // Environment and process metadata.
  APP_ENV: z
    .enum(['development', 'test', 'staging', 'production'])
    .default('development'),
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
  // Max JSON/urlencoded request body size accepted by Express (e.g. "1mb", "500kb").
  API_BODY_LIMIT: z
    .string()
    .regex(/^\d+(b|kb|mb|gb)$/i, 'must be a size like "1mb" or "500kb"')
    .default('1mb'),
  WEB_PORT: z.coerce.number().int().positive(),
  WEB_ORIGIN: commaSeparatedOrigins,
  // Admin app origin(s) for SSO post-login redirects and CORS-adjacent allowlists.
  ADMIN_ORIGIN: z.preprocess(
    (value) => (value === '' ? undefined : value),
    commaSeparatedOrigins.optional(),
  ),
  // Exact redirect URIs for native deep links (e.g. myapp://sso/callback).
  SSO_REDIRECT_URIS: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().optional(),
  ),
  API_INTERNAL_URL: z.url(),
  NEXT_PUBLIC_WEB_URL: z.url(),
  NEXT_PUBLIC_API_BASE_PATH: z.string().min(1).default('/api'),
  // Optional Redis endpoint for shared throttling, cache, and fan-out. Leave empty to keep single-instance behavior.
  REDIS_URL: emptyStringToUndefined,
  // Access-profile cache TTL in seconds. Uses in-process memory when REDIS_URL is unset.
  ACCESS_PROFILE_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60),
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
    .regex(/^[0-9a-fA-F]{64}$/, 'must be a 64-character hex string (32 bytes)'),
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
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  // Seed credentials are used by bootstrap data and e2e setup only.
  SEED_ADMIN_EMAIL: z.email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
  SEED_USER_EMAIL: z.email(),
  SEED_USER_PASSWORD: z.string().min(8),
  // Optional Firebase credentials for push notification delivery.
  FCM_PROJECT_ID: emptyStringToUndefined,
  FCM_CLIENT_EMAIL: emptyStringToUndefined,
  FCM_PRIVATE_KEY: emptyStringToUndefined,
  // Object storage configuration for file uploads and generated artifacts.
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().min(1).default('./storage'),
  S3_BUCKET: emptyStringToUndefined,
  S3_REGION: emptyStringToUndefined,
  S3_ACCESS_KEY_ID: emptyStringToUndefined,
  S3_SECRET_ACCESS_KEY: emptyStringToUndefined,
  S3_ENDPOINT: emptyStringToUndefined,
}).superRefine((env, ctx) => {
  if (env.APP_ENV === 'test' && !env.DATABASE_URL_TEST) {
    ctx.addIssue({
      code: 'custom',
      path: ['DATABASE_URL_TEST'],
      message: 'DATABASE_URL_TEST is required when APP_ENV=test',
    });
  }

  if (env.APP_ENV === 'production' && env.SSO_FAKE_PROVIDER_ENABLED) {
    ctx.addIssue({
      code: 'custom',
      path: ['SSO_FAKE_PROVIDER_ENABLED'],
      message: 'SSO_FAKE_PROVIDER_ENABLED must not be enabled in production',
    });
  }

  // Deployed environments (staging + production) must not reuse the development
  // placeholder secrets that ship with the template.
  const isDeployed = env.APP_ENV === 'staging' || env.APP_ENV === 'production';
  if (isDeployed) {
    if (DEV_PLACEHOLDER_SECRETS.has(env.JWT_ACCESS_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_ACCESS_SECRET'],
        message:
          'must not reuse the development placeholder secret in staging/production',
      });
    }
    if (DEV_PLACEHOLDER_SECRETS.has(env.JWT_REFRESH_SECRET)) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message:
          'must not reuse the development placeholder secret in staging/production',
      });
    }
    if (env.MFA_ENCRYPTION_KEY === DEV_PLACEHOLDER_MFA_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['MFA_ENCRYPTION_KEY'],
        message:
          'must not reuse the development placeholder key in staging/production',
      });
    }
  }

  // Deployed environments must serve over HTTPS with secure cookies.
  if (isDeployed) {
    if (!env.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'must be true in staging/production',
      });
    }
    if (!everyOriginIsHttps(env.WEB_ORIGIN)) {
      ctx.addIssue({
        code: 'custom',
        path: ['WEB_ORIGIN'],
        message: 'must use https in staging/production',
      });
    }
    if (!env.NEXT_PUBLIC_WEB_URL.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_WEB_URL'],
        message: 'must use https in staging/production',
      });
    }
    if (env.ADMIN_ORIGIN && !everyOriginIsHttps(env.ADMIN_ORIGIN)) {
      ctx.addIssue({
        code: 'custom',
        path: ['ADMIN_ORIGIN'],
        message: 'must use https in staging/production when set',
      });
    }
  }
});

export type AppEnvironment = z.infer<typeof envSchema>;

export const validateEnvironment = (
  input: Record<string, unknown>,
): AppEnvironment => {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment variables: ${details}`);
  }

  return result.data;
};
