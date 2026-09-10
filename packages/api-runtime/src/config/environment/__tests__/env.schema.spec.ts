import { describe, expect, it } from "vitest";

import { validateEnvironment } from "../env.schema";

// Minimal set of required variables; everything else has a schema default.
const baseEnv: Record<string, unknown> = {
  APP_ENV: "test",
  POSTGRES_HOST: "localhost",
  POSTGRES_PORT: "5432",
  POSTGRES_DB: "app",
  POSTGRES_USER: "app",
  POSTGRES_PASSWORD: "secret",
  DATABASE_URL: "postgres://app:secret@localhost:5432/app",
  DATABASE_URL_TEST: "postgres://app:secret@localhost:5432/app_test",
  WEB_PORT: "3000",
  WEB_ORIGIN: "http://localhost:3000",
  API_INTERNAL_URL: "http://localhost:3001",
  NEXT_PUBLIC_WEB_URL: "http://localhost:3000",
  JWT_ACCESS_SECRET: "a".repeat(24),
  JWT_REFRESH_SECRET: "b".repeat(24),
  JWT_ACCESS_TTL: "15m",
  JWT_REFRESH_TTL: "7d",
  MFA_ENCRYPTION_KEY: "a".repeat(64),
  MAIL_HOST: "localhost",
  MAIL_PORT: "1025",
  MAIL_FROM: "noreply@example.com",
  SEED_ADMIN_EMAIL: "admin@example.com",
  SEED_ADMIN_PASSWORD: "password123",
  SEED_USER_EMAIL: "user@example.com",
  SEED_USER_PASSWORD: "password123",
};

// Overrides that turn baseEnv into a valid production configuration: real (non
// placeholder) secrets from baseEnv, secure cookies, https public URLs, and S3.
const secureProdOverrides: Record<string, unknown> = {
  APP_ENV: "production",
  COOKIE_SECURE: "true",
  WEB_ORIGIN: "https://app.example.com",
  NEXT_PUBLIC_WEB_URL: "https://app.example.com",
  API_INTERNAL_URL: "https://api.internal.example.com",
  STORAGE_DRIVER: "s3",
  S3_BUCKET: "app-uploads",
  REDIS_URL: "redis://localhost:6379",
};

const secureStagingOverrides: Record<string, unknown> = {
  APP_ENV: "staging",
  COOKIE_SECURE: "true",
  WEB_ORIGIN: "https://staging.example.com",
  NEXT_PUBLIC_WEB_URL: "https://staging.example.com",
  API_INTERNAL_URL: "https://api.staging.internal.example.com",
  ADMIN_ORIGIN: "https://admin.staging.example.com",
  STORAGE_DRIVER: "s3",
  S3_BUCKET: "staging-uploads",
};

describe("validateEnvironment", () => {
  it("parses a valid environment and applies defaults", () => {
    const env = validateEnvironment({ ...baseEnv });
    expect(env.APP_ENV).toBe("test");
    expect(env.API_PORT).toBe(3001);
    expect(env.ACCESS_PROFILE_CACHE_TTL_SECONDS).toBe(60);
    expect(env.SETTINGS_LOOKUP_CACHE_TTL_SECONDS).toBe(5);
    expect(env.COOKIE_SAMESITE).toBe("lax");
    expect(env.STORAGE_DRIVER).toBe("local");
  });

  it("coerces numeric strings into numbers", () => {
    const env = validateEnvironment({ ...baseEnv });
    expect(env.POSTGRES_PORT).toBe(5432);
    expect(env.WEB_PORT).toBe(3000);
  });

  it("coerces boolean-like strings", () => {
    const env = validateEnvironment({
      ...baseEnv,
      API_DOCS_ENABLED: "false",
      COOKIE_SECURE: "true",
    });
    expect(env.API_DOCS_ENABLED).toBe(false);
    expect(env.COOKIE_SECURE).toBe(true);
  });

  it("treats empty optional strings as undefined", () => {
    const env = validateEnvironment({ ...baseEnv, REDIS_URL: "" });
    expect(env.REDIS_URL).toBeUndefined();
  });

  it("accepts optional replica URLs and treats blank values as disabled", () => {
    const env = validateEnvironment({
      ...baseEnv,
      DATABASE_URL_READ_REPLICA: "postgres://replica/app",
      DATABASE_URL_TEST_READ_REPLICA: "",
    });
    expect(env.DATABASE_URL_READ_REPLICA).toBe("postgres://replica/app");
    expect(env.DATABASE_URL_TEST_READ_REPLICA).toBeUndefined();
  });

  it("throws a descriptive error when a required variable is missing", () => {
    const { POSTGRES_HOST: _omitted, ...withoutHost } = baseEnv;
    expect(() => validateEnvironment(withoutHost)).toThrow(/Invalid environment variables/);
  });

  it("throws when a numeric variable is not a number", () => {
    expect(() => validateEnvironment({ ...baseEnv, POSTGRES_PORT: "not-a-port" })).toThrow(
      /Invalid environment variables/,
    );
  });

  it("rejects JWT secrets that are too short", () => {
    expect(() => validateEnvironment({ ...baseEnv, JWT_ACCESS_SECRET: "short" })).toThrow(
      /Invalid environment variables/,
    );
  });

  it("rejects a JWT TTL that is not a valid duration", () => {
    expect(() => validateEnvironment({ ...baseEnv, JWT_ACCESS_TTL: "15min" })).toThrow(
      /Invalid environment variables/,
    );
  });

  it("rejects a WEB_ORIGIN entry that is not a valid URL", () => {
    expect(() => validateEnvironment({ ...baseEnv, WEB_ORIGIN: "not a url" })).toThrow(
      /Invalid environment variables/,
    );
  });

  it("accepts a comma-separated list of WEB_ORIGIN URLs", () => {
    const env = validateEnvironment({
      ...baseEnv,
      WEB_ORIGIN: "http://a.com, http://b.com",
    });
    expect(env.WEB_ORIGIN).toBe("http://a.com, http://b.com");
  });

  it("requires DATABASE_URL_TEST only when APP_ENV=test", () => {
    const { DATABASE_URL_TEST: _testUrl, ...withoutTestUrl } = baseEnv;

    // Production boots fine without a test database URL (given secure prod config).
    expect(
      validateEnvironment({ ...withoutTestUrl, ...secureProdOverrides }).DATABASE_URL_TEST,
    ).toBeUndefined();

    // Test runs must provide it.
    expect(() => validateEnvironment({ ...withoutTestUrl, APP_ENV: "test" })).toThrow(
      /DATABASE_URL_TEST is required/,
    );
  });

  it("rejects insecure cookies in production", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureProdOverrides,
        COOKIE_SECURE: "false",
      }),
    ).toThrow(/COOKIE_SECURE/);
  });

  it("requires REDIS_URL in production", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureProdOverrides,
        REDIS_URL: "",
      }),
    ).toThrow(/REDIS_URL is required in production/);
  });

  it("rejects insecure cookies in staging", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureStagingOverrides,
        COOKIE_SECURE: "false",
      }),
    ).toThrow(/COOKIE_SECURE/);
  });

  it("rejects a non-https WEB_ORIGIN in production", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureProdOverrides,
        WEB_ORIGIN: "http://app.example.com",
      }),
    ).toThrow(/https/);
  });

  it("rejects a non-https WEB_ORIGIN in staging", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureStagingOverrides,
        WEB_ORIGIN: "http://staging.example.com",
      }),
    ).toThrow(/https/);
  });

  it("rejects a non-https ADMIN_ORIGIN in staging when set", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureStagingOverrides,
        ADMIN_ORIGIN: "http://admin.staging.example.com",
      }),
    ).toThrow(/ADMIN_ORIGIN/);
  });

  it("accepts a fully configured staging environment", () => {
    const env = validateEnvironment({ ...baseEnv, ...secureStagingOverrides });
    expect(env.APP_ENV).toBe("staging");
    expect(env.COOKIE_SECURE).toBe(true);
  });

  it("rejects reusing the dev placeholder JWT secret in production", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureProdOverrides,
        JWT_ACCESS_SECRET: "replace-with-a-long-random-development-secret",
      }),
    ).toThrow(/placeholder/);
  });

  it("rejects reusing the dev placeholder secrets in staging", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        APP_ENV: "staging",
        JWT_REFRESH_SECRET: "replace-with-another-long-random-development-secret",
      }),
    ).toThrow(/placeholder/);
  });

  it("accepts a fully configured production environment", () => {
    const env = validateEnvironment({ ...baseEnv, ...secureProdOverrides });
    expect(env.APP_ENV).toBe("production");
    expect(env.COOKIE_SECURE).toBe(true);
  });

  it("rejects DATABASE_SKIP_RLS_CHECK in production", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureProdOverrides,
        DATABASE_SKIP_RLS_CHECK: "true",
      }),
    ).toThrow(/DATABASE_SKIP_RLS_CHECK/);
  });

  it("rejects DATABASE_SKIP_RLS_CHECK in staging", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureStagingOverrides,
        DATABASE_SKIP_RLS_CHECK: "true",
      }),
    ).toThrow(/DATABASE_SKIP_RLS_CHECK/);
  });

  it("allows DATABASE_SKIP_RLS_CHECK in development", () => {
    const env = validateEnvironment({
      ...baseEnv,
      APP_ENV: "development",
      DATABASE_SKIP_RLS_CHECK: "true",
    });
    expect(env.DATABASE_SKIP_RLS_CHECK).toBe(true);
  });

  it("allows production boot without SEED_* credentials", () => {
    const {
      SEED_ADMIN_EMAIL: _a,
      SEED_ADMIN_PASSWORD: _b,
      SEED_USER_EMAIL: _c,
      SEED_USER_PASSWORD: _d,
      ...withoutSeed
    } = baseEnv;

    const env = validateEnvironment({ ...withoutSeed, ...secureProdOverrides });
    expect(env.SEED_ADMIN_EMAIL).toBeUndefined();
    expect(env.SEED_ADMIN_PASSWORD).toBeUndefined();
  });

  it("treats empty SEED_* strings as undefined", () => {
    const env = validateEnvironment({
      ...baseEnv,
      SEED_ADMIN_EMAIL: "",
      SEED_ADMIN_PASSWORD: "",
    });
    expect(env.SEED_ADMIN_EMAIL).toBeUndefined();
    expect(env.SEED_ADMIN_PASSWORD).toBeUndefined();
  });

  it("rejects STORAGE_DRIVER=local in production", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureProdOverrides,
        STORAGE_DRIVER: "local",
      }),
    ).toThrow(/STORAGE_DRIVER/);
  });

  it("rejects s3 without S3_BUCKET in staging", () => {
    expect(() =>
      validateEnvironment({
        ...baseEnv,
        ...secureStagingOverrides,
        S3_BUCKET: "",
      }),
    ).toThrow(/S3_BUCKET/);
  });
});
