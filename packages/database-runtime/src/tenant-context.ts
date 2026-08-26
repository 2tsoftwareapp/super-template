import type { TenantContext } from "@repo/api-runtime";
import type { PoolClient } from "pg";

import { sql } from "drizzle-orm";

import type { DatabaseClient, DatabaseExecutor, DatabaseTransaction } from "./database.types";

// Transaction-scoped path: is_local=true so the GUCs auto-reset when the
// surrounding transaction ends. Used inside runInTransaction/withTenantContext.
// All three GUCs are set in a single round trip to avoid 3x latency per checkout.
export const setTenantContextOnExecutor = async (
  executor: DatabaseExecutor,
  context: TenantContext,
): Promise<void> => {
  await executor.execute(sql`
    select
      set_config('app.tenant_id', ${context.tenantId}, true),
      set_config('app.user_id', ${context.userId}, true),
      set_config('app.bypass_rls', ${context.bypassRls ? "true" : "false"}, true)
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
): Promise<void> => {
  await client.query(
    `select
      set_config('app.tenant_id', $1, false),
      set_config('app.user_id', $2, false),
      set_config('app.bypass_rls', $3, false)`,
    [context?.tenantId ?? "", context?.userId ?? "", context?.bypassRls ? "true" : "false"],
  );
};

export const withTenantContext = async <T>(
  database: DatabaseClient,
  context: TenantContext,
  operation: (transaction: DatabaseTransaction) => Promise<T>,
): Promise<T> =>
  database.transaction(async (transaction) => {
    await setTenantContextOnExecutor(transaction, context);
    return operation(transaction);
  });
