import type { DatabaseRuntimeOptions, TenantContext, TenantMode } from "@repo/api-kernel";
import type { PoolClient } from "pg";

import { sql } from "drizzle-orm";

import type { DatabaseClient, DatabaseExecutor, DatabaseTransaction } from "./database.types";

const DEFAULT_TENANT_MODE: TenantMode = "shared-schema";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolve a tenant schema name without interpolating an untrusted identifier.
 * @param tenantId Tenant UUID, or an empty value for the public schema.
 * @returns A derived `tenant_<uuid>` identifier or `public`.
 * @throws When a non-empty tenant ID is not a supported UUID.
 */
export const resolveTenantSchemaName = (tenantId: string): string => {
  if (!tenantId) return "public";
  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("Invalid tenant id for schema-per-tenant mode; expected a UUID.");
  }
  return `tenant_${tenantId.replaceAll("-", "_").toLowerCase()}`;
};

/**
 * Build the connection-local search path for the selected tenant strategy.
 * @param tenantId Tenant UUID, or an empty value for the public schema.
 * @param tenantMode Selected tenant isolation strategy.
 * @returns A connection-local search path.
 * @throws When schema-per-tenant mode receives an invalid non-empty tenant ID.
 */
export const resolveTenantSearchPath = (
  tenantId: string,
  tenantMode: TenantMode = DEFAULT_TENANT_MODE,
): string => {
  if (tenantMode !== "schema-per-tenant" || !tenantId) return "public";
  return `${resolveTenantSchemaName(tenantId)}, public`;
};

const tenantContextConfig = (
  context: TenantContext | undefined,
  options: DatabaseRuntimeOptions,
) => {
  const tenantId = context?.tenantId ?? "";
  return {
    tenantId,
    userId: context?.userId ?? "",
    bypassRls: context?.bypassRls ? "true" : "false",
    searchPath: resolveTenantSearchPath(tenantId, options.tenantMode),
  };
};

// Transaction-scoped path: is_local=true so the GUCs auto-reset when the
// surrounding transaction ends. Used inside runInTransaction/withTenantContext.
// All tenant context settings are set in a single round trip to avoid extra checkout latency.
export const setTenantContextOnExecutor = async (
  executor: DatabaseExecutor,
  context: TenantContext,
  options?: DatabaseRuntimeOptions,
): Promise<void> => {
  const runtimeOptions =
    options ??
    ({
      tenantMode: DEFAULT_TENANT_MODE,
      readReplica: false,
      readConsistency: "strong",
    } satisfies DatabaseRuntimeOptions);
  const config = tenantContextConfig(context, runtimeOptions);
  if (runtimeOptions.tenantMode === "schema-per-tenant") {
    await executor.execute(sql`
      select
        set_config('app.tenant_id', ${config.tenantId}, true),
        set_config('app.user_id', ${config.userId}, true),
        set_config('app.bypass_rls', ${config.bypassRls}, true),
        set_config('search_path', ${config.searchPath}, true)
    `);
    return;
  }
  await executor.execute(sql`
    select
      set_config('app.tenant_id', ${config.tenantId}, true),
      set_config('app.user_id', ${config.userId}, true),
      set_config('app.bypass_rls', ${config.bypassRls}, true)
  `);
};

// Pooled-connection path: is_local=false (session-level) so the context survives
// across the multiple implicit transactions a checked-out client may run. This is
// safe because createTenantAwarePool re-applies the context on every checkout, so a
// connection never leaks the previous request's tenant. Do NOT switch this to
// is_local=true: a non-transactional query on the same client would lose the context.
export const setTenantContextOnPgClient = async (
  client: PoolClient,
  context?: TenantContext,
  options?: DatabaseRuntimeOptions,
): Promise<void> => {
  const runtimeOptions =
    options ??
    ({
      tenantMode: DEFAULT_TENANT_MODE,
      readReplica: false,
      readConsistency: "strong",
    } satisfies DatabaseRuntimeOptions);
  const config = tenantContextConfig(context, runtimeOptions);
  if (runtimeOptions.tenantMode === "schema-per-tenant") {
    await client.query(
      `select
        set_config('app.tenant_id', $1, false),
        set_config('app.user_id', $2, false),
        set_config('app.bypass_rls', $3, false),
        set_config('search_path', $4, false)`,
      [config.tenantId, config.userId, config.bypassRls, config.searchPath],
    );
    return;
  }
  await client.query(
    `select
      set_config('app.tenant_id', $1, false),
      set_config('app.user_id', $2, false),
      set_config('app.bypass_rls', $3, false)`,
    [config.tenantId, config.userId, config.bypassRls],
  );
};

export const withTenantContext = async <T>(
  database: DatabaseClient,
  context: TenantContext,
  operation: (transaction: DatabaseTransaction) => Promise<T>,
  options?: DatabaseRuntimeOptions,
): Promise<T> =>
  database.transaction(async (transaction) => {
    await setTenantContextOnExecutor(transaction, context, options);
    return operation(transaction);
  });
