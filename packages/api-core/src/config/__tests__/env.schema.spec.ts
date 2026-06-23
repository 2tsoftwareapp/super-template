import { describe, expect, it } from 'vitest';

import { validateEnvironment } from '../env.schema';

// Minimal set of required variables; everything else has a schema default.
const baseEnv: Record<string, unknown> = {
  APP_ENV: 'test',
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_DB: 'app',
  POSTGRES_USER: 'app',
  POSTGRES_PASSWORD: 'secret',
  DATABASE_URL: 'postgres://app:secret@localhost:5432/app',
  DATABASE_URL_TEST: 'postgres://app:secret@localhost:5432/app_test',
  WEB_PORT: '3000',
  WEB_ORIGIN: 'http://localhost:3000',
  API_INTERNAL_URL: 'http://localhost:3001',
  NEXT_PUBLIC_WEB_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'a'.repeat(24),
  JWT_REFRESH_SECRET: 'b'.repeat(24),
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL: '7d',
  MFA_ENCRYPTION_KEY: 'a'.repeat(64),
  MAIL_HOST: 'localhost',
  MAIL_PORT: '1025',
  MAIL_FROM: 'noreply@example.com',
  SEED_ADMIN_EMAIL: 'admin@example.com',
  SEED_ADMIN_PASSWORD: 'password123',
  SEED_USER_EMAIL: 'user@example.com',
  SEED_USER_PASSWORD: 'password123',
};

describe('validateEnvironment', () => {
  it('parses a valid environment and applies defaults', () => {
    const env = validateEnvironment({ ...baseEnv });
    expect(env.APP_ENV).toBe('test');
    expect(env.API_PORT).toBe(3001);
    expect(env.ACCESS_PROFILE_CACHE_TTL_SECONDS).toBe(60);
    expect(env.COOKIE_SAMESITE).toBe('lax');
    expect(env.STORAGE_DRIVER).toBe('local');
  });

  it('coerces numeric strings into numbers', () => {
    const env = validateEnvironment({ ...baseEnv });
    expect(env.POSTGRES_PORT).toBe(5432);
    expect(env.WEB_PORT).toBe(3000);
  });

  it('coerces boolean-like strings', () => {
    const env = validateEnvironment({
      ...baseEnv,
      API_DOCS_ENABLED: 'false',
      COOKIE_SECURE: 'true',
    });
    expect(env.API_DOCS_ENABLED).toBe(false);
    expect(env.COOKIE_SECURE).toBe(true);
  });

  it('treats empty optional strings as undefined', () => {
    const env = validateEnvironment({ ...baseEnv, REDIS_URL: '' });
    expect(env.REDIS_URL).toBeUndefined();
  });

  it('throws a descriptive error when a required variable is missing', () => {
    const { POSTGRES_HOST: _omitted, ...withoutHost } = baseEnv;
    expect(() => validateEnvironment(withoutHost)).toThrow(
      /Invalid environment variables/,
    );
  });

  it('throws when a numeric variable is not a number', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, POSTGRES_PORT: 'not-a-port' }),
    ).toThrow(/Invalid environment variables/);
  });

  it('rejects JWT secrets that are too short', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, JWT_ACCESS_SECRET: 'short' }),
    ).toThrow(/Invalid environment variables/);
  });

  it('rejects a JWT TTL that is not a valid duration', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, JWT_ACCESS_TTL: '15min' }),
    ).toThrow(/Invalid environment variables/);
  });

  it('rejects a WEB_ORIGIN entry that is not a valid URL', () => {
    expect(() =>
      validateEnvironment({ ...baseEnv, WEB_ORIGIN: 'not a url' }),
    ).toThrow(/Invalid environment variables/);
  });

  it('accepts a comma-separated list of WEB_ORIGIN URLs', () => {
    const env = validateEnvironment({
      ...baseEnv,
      WEB_ORIGIN: 'http://a.com, http://b.com',
    });
    expect(env.WEB_ORIGIN).toBe('http://a.com, http://b.com');
  });

  it('requires DATABASE_URL_TEST only when APP_ENV=test', () => {
    const { DATABASE_URL_TEST: _testUrl, ...withoutTestUrl } = baseEnv;

    // Production boots fine without a test database URL.
    expect(
      validateEnvironment({ ...withoutTestUrl, APP_ENV: 'production' })
        .DATABASE_URL_TEST,
    ).toBeUndefined();

    // Test runs must provide it.
    expect(() =>
      validateEnvironment({ ...withoutTestUrl, APP_ENV: 'test' }),
    ).toThrow(/DATABASE_URL_TEST is required/);
  });
});
