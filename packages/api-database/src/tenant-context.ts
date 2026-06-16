import { sql } from 'drizzle-orm';
import type { PoolClient } from 'pg';
import type {
  DatabaseClient,
  DatabaseExecutor,
  DatabaseTransaction,
} from './database.types';

export type TenantContext = {
  tenantId: string;
  userId: string;
  bypassRls?: boolean;
};

export const setTenantContextOnExecutor = async (
  executor: DatabaseExecutor,
  context: TenantContext,
): Promise<void> => {
  await executor.execute(
    sql`select set_config('app.tenant_id', ${context.tenantId}, true)`,
  );
  await executor.execute(
    sql`select set_config('app.user_id', ${context.userId}, true)`,
  );
  await executor.execute(
    sql`select set_config('app.bypass_rls', ${context.bypassRls ? 'true' : 'false'}, true)`,
  );
};

export const setTenantContextOnPgClient = async (
  client: PoolClient,
  context: TenantContext,
): Promise<void> => {
  await client.query("select set_config('app.tenant_id', $1, true)", [
    context.tenantId,
  ]);
  await client.query("select set_config('app.user_id', $1, true)", [
    context.userId,
  ]);
  await client.query("select set_config('app.bypass_rls', $1, true)", [
    context.bypassRls ? 'true' : 'false',
  ]);
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
