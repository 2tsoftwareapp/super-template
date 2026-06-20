import { Inject, Injectable } from '@nestjs/common';

import type { AppEnvironment } from './env.schema';

import { APP_ENVIRONMENT } from './config.constants';

@Injectable()
export class EnvironmentService {
  constructor(@Inject(APP_ENVIRONMENT) private readonly env: AppEnvironment) {}

  get values(): AppEnvironment {
    return this.env;
  }

  get isProduction(): boolean {
    return this.env.APP_ENV === 'production';
  }

  get isTest(): boolean {
    return this.env.APP_ENV === 'test';
  }

  get appEnv(): AppEnvironment['APP_ENV'] {
    return this.env.APP_ENV;
  }

  get accessProfileCacheTtlSeconds(): number {
    return this.env.ACCESS_PROFILE_CACHE_TTL_SECONDS;
  }

  get apiDocsEnabled(): boolean {
    return this.env.API_DOCS_ENABLED;
  }

  get apiPort(): number {
    return this.env.API_PORT;
  }

  get corsOrigins(): string[] {
    return this.env.WEB_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get databaseSkipRlsCheck(): boolean {
    return this.env.DATABASE_SKIP_RLS_CHECK;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get databaseUrlTest(): string | undefined {
    return this.env.DATABASE_URL_TEST;
  }

  get redisUrl(): string | undefined {
    return this.env.REDIS_URL;
  }

  get seedAdminEmail(): string {
    return this.env.SEED_ADMIN_EMAIL;
  }

  get seedAdminPassword(): string {
    return this.env.SEED_ADMIN_PASSWORD;
  }

  get seedUserEmail(): string {
    return this.env.SEED_USER_EMAIL;
  }

  get seedUserPassword(): string {
    return this.env.SEED_USER_PASSWORD;
  }

  get sentryDsn(): string | undefined {
    return this.env.SENTRY_DSN;
  }
}
