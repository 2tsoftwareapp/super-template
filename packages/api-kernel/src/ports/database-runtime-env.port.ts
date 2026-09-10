/** Tenant isolation strategies supported by the database runtime. */
export type TenantMode = "shared-schema" | "schema-per-tenant";

/** Read consistency policies supported by the database runtime. */
export type DatabaseReadConsistency = "strong" | "eventual";

/** Runtime topology selected by the composed feature manifests. */
export interface DatabaseRuntimeOptions {
  readonly tenantMode: TenantMode;
  readonly readReplica: boolean;
  readonly readConsistency: DatabaseReadConsistency;
}

/**
 * Narrow DB connection env consumed by `@repo/database-runtime`.
 * The host provides this adapter so database-runtime does not import the HTTP
 * runtime package.
 */
export interface DatabaseRuntimeEnv {
  readonly isTest: boolean;
  readonly databaseUrl: string;
  readonly databaseUrlTest?: string;
  readonly databaseUrlReadReplica?: string;
  readonly databaseUrlTestReadReplica?: string;
  readonly databaseSkipRlsCheck: boolean;
}

export const DATABASE_RUNTIME_ENV = Symbol("DATABASE_RUNTIME_ENV");
