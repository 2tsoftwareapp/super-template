import { describe, expect, it } from 'vitest';

import type { AppEnvironment } from '../env.schema';

import { EnvironmentService } from '../environment.service';

function makeService(overrides: Partial<AppEnvironment> = {}): EnvironmentService {
  const env = {
    APP_ENV: 'development',
    WEB_ORIGIN: 'http://localhost:3000',
    DATABASE_URL: 'postgres://localhost/app',
    DATABASE_URL_TEST: 'postgres://localhost/app_test',
    DATABASE_SKIP_RLS_CHECK: false,
    ACCESS_PROFILE_CACHE_TTL_SECONDS: 60,
    REDIS_URL: undefined,
    ...overrides,
  } as AppEnvironment;

  return new EnvironmentService(env);
}

describe('EnvironmentService', () => {
  it('reports the production flag based on APP_ENV', () => {
    expect(makeService({ APP_ENV: 'production' }).isProduction).toBe(true);
    expect(makeService({ APP_ENV: 'development' }).isProduction).toBe(false);
  });

  it('reports the test flag based on APP_ENV', () => {
    expect(makeService({ APP_ENV: 'test' }).isTest).toBe(true);
    expect(makeService({ APP_ENV: 'production' }).isTest).toBe(false);
  });

  it('splits, trims, and filters CORS origins', () => {
    const service = makeService({
      WEB_ORIGIN: 'http://a.com, http://b.com ,, http://c.com',
    });
    expect(service.corsOrigins).toEqual([
      'http://a.com',
      'http://b.com',
      'http://c.com',
    ]);
  });

  it('exposes typed getters for selected values', () => {
    const service = makeService({
      DATABASE_URL: 'postgres://primary/app',
      DATABASE_URL_TEST: 'postgres://test/app',
      REDIS_URL: 'redis://localhost:6379',
    });
    expect(service.databaseUrl).toBe('postgres://primary/app');
    expect(service.databaseUrlTest).toBe('postgres://test/app');
    expect(service.redisUrl).toBe('redis://localhost:6379');
  });
});
