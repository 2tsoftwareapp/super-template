import type { Pool } from "pg";

import { drizzle } from "drizzle-orm/node-postgres";
import { withReplicas } from "drizzle-orm/pg-core";

import { schema as defaultSchema } from "./schema";

/**
 * Build the Drizzle client. The composed schema is injected by the application
 * (via {@link DatabaseModule.forRoot}) so optional feature packages can each
 * contribute their own tables. When no schema is supplied the empty runtime
 * default is used — prefer passing the host's composed schema.
 */
export const createDatabaseClient = (pool: Pool, schema: Record<string, unknown> = defaultSchema) =>
  drizzle(pool, {
    schema: schema,
  });

/**
 * Build a Drizzle client whose read helpers use the replica while mutation,
 * raw execution, and transaction helpers remain bound to the primary client.
 * The replica pool is already tenant-aware before it reaches this function.
 */
export const createReadReplicaDatabaseClient = (
  primaryPool: Pool,
  replicaPool: Pool,
  schema: Record<string, unknown> = defaultSchema,
) => {
  const primary = createDatabaseClient(primaryPool, schema);
  const replica = createDatabaseClient(replicaPool, schema);
  return withReplicas(primary, [replica], () => replica);
};

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
/** Drizzle client that routes eligible reads to a configured replica. */
export type ReadReplicaDatabaseClient = ReturnType<typeof createReadReplicaDatabaseClient>;
export type DatabaseTransaction = Parameters<Parameters<DatabaseClient["transaction"]>[0]>[0];
export type DatabaseExecutor = DatabaseClient | DatabaseTransaction;
