/**
 * Narrow DB connection env consumed by `@repo/database-runtime`.
 * Provided by the host (typically `AppConfigModule` adapting `EnvironmentService`)
 * so database-runtime never imports the HTTP runtime package.
 */
export interface DatabaseRuntimeEnv {
  readonly isTest: boolean;
  readonly databaseUrl: string;
  readonly databaseUrlTest?: string;
  readonly databaseSkipRlsCheck: boolean;
}

export const DATABASE_RUNTIME_ENV = Symbol("DATABASE_RUNTIME_ENV");
