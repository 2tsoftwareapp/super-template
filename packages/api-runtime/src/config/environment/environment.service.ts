import { Inject, Injectable } from "@nestjs/common";

import type { AppEnvironment } from "./env.schema";

import { APP_ENVIRONMENT } from "./config.constants";

@Injectable()
export class EnvironmentService {
  constructor(@Inject(APP_ENVIRONMENT) private readonly env: AppEnvironment) {}

  get values(): AppEnvironment {
    return this.env;
  }

  get isProduction(): boolean {
    return this.env.APP_ENV === "production";
  }

  get isStaging(): boolean {
    return this.env.APP_ENV === "staging";
  }

  get isDevelopment(): boolean {
    return this.env.APP_ENV === "development";
  }

  get isTest(): boolean {
    return this.env.APP_ENV === "test";
  }

  /**
   * E2E suites run under NODE_ENV=test but APP_ENV=development (they use the dev
   * database). This flag keeps the tenant-override backdoor available to those
   * suites only, and never in a deployed environment.
   */
  get allowsTenantOverrideForTests(): boolean {
    return process.env.NODE_ENV === "test" && !this.isProductionLike;
  }

  /** True for deployed, internet-facing environments (staging + production). */
  get isProductionLike(): boolean {
    return this.env.APP_ENV === "production" || this.env.APP_ENV === "staging";
  }

  get appEnv(): AppEnvironment["APP_ENV"] {
    return this.env.APP_ENV;
  }

  get accessProfileCacheTtlSeconds(): number {
    return this.env.ACCESS_PROFILE_CACHE_TTL_SECONDS;
  }

  get settingsLookupCacheTtlSeconds(): number {
    return this.env.SETTINGS_LOOKUP_CACHE_TTL_SECONDS;
  }

  get apiDocsEnabled(): boolean {
    return this.env.API_DOCS_ENABLED;
  }

  get apiPort(): number {
    return this.env.API_PORT;
  }

  get apiBodyLimit(): string {
    return this.env.API_BODY_LIMIT;
  }

  get corsOrigins(): string[] {
    return this.env.WEB_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  /** HTTP(S) origins allowed for SSO post-login redirects (web + admin). */
  get ssoRedirectOrigins(): string[] {
    const adminOrigins = this.env.ADMIN_ORIGIN
      ? this.env.ADMIN_ORIGIN.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean)
      : [];

    return [...new Set([...this.corsOrigins, ...adminOrigins])];
  }

  /** Exact redirect URIs (including custom URL schemes) for native SSO clients. */
  get ssoRedirectUris(): string[] {
    if (!this.env.SSO_REDIRECT_URIS) {
      return [];
    }

    return this.env.SSO_REDIRECT_URIS.split(",")
      .map((uri) => uri.trim())
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

  get databaseUrlReadReplica(): string | undefined {
    return this.env.DATABASE_URL_READ_REPLICA;
  }

  get databaseUrlTestReadReplica(): string | undefined {
    return this.env.DATABASE_URL_TEST_READ_REPLICA;
  }

  get redisUrl(): string | undefined {
    return this.env.REDIS_URL;
  }

  get seedAdminEmail(): string | undefined {
    return this.env.SEED_ADMIN_EMAIL;
  }

  get seedAdminPassword(): string | undefined {
    return this.env.SEED_ADMIN_PASSWORD;
  }

  get seedUserEmail(): string | undefined {
    return this.env.SEED_USER_EMAIL;
  }

  get seedUserPassword(): string | undefined {
    return this.env.SEED_USER_PASSWORD;
  }

  get sentryDsn(): string | undefined {
    return this.env.SENTRY_DSN;
  }
}
