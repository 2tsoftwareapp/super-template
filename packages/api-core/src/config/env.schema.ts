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
  DATABASE_URL_TEST: z.url(),
  // Public and internal HTTP endpoints.
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_PORT: z.coerce.number().int().positive(),
  WEB_ORIGIN: z.string().min(1),
  API_INTERNAL_URL: z.url(),
  NEXT_PUBLIC_WEB_URL: z.url(),
  NEXT_PUBLIC_API_BASE_PATH: z.string().min(1).default('/api'),
  // Optional HTTP log export sink. Leave empty in local dev to keep logs console-only.
  LOGGING_HTTP_ENDPOINT: emptyStringToUndefined,
  LOGGING_HTTP_AUTH_TOKEN: emptyStringToUndefined,
  LOGGING_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
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
  JWT_ACCESS_TTL: z.string().min(2),
  JWT_REFRESH_TTL: z.string().min(2),
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
