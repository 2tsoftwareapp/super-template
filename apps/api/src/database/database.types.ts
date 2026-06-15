import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { schema } from './schema';

export const createDatabaseClient = (pool: Pool) =>
  drizzle(pool, {
    schema,
  });

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
export type DatabaseTransaction = Parameters<
  Parameters<DatabaseClient['transaction']>[0]
>[0];
export type DatabaseExecutor = DatabaseClient | DatabaseTransaction;
