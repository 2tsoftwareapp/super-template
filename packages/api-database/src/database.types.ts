import type { Pool } from "pg";

import { drizzle } from "drizzle-orm/node-postgres";

import { schema as defaultSchema } from "./schema";

/**
 * Build the Drizzle client. The composed schema is injected by the application
 * (via {@link DatabaseModule.forRoot}) so optional feature packages can each
 * contribute their own tables. When no schema is supplied the full built-in
 * schema is used, preserving the previous behaviour for callers that construct
 * a client directly (scripts, tests).
 */
export const createDatabaseClient = (pool: Pool, schema: Record<string, unknown> = defaultSchema) =>
  drizzle(pool, {
    schema: schema as typeof defaultSchema,
  });

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
export type DatabaseTransaction = Parameters<Parameters<DatabaseClient["transaction"]>[0]>[0];
export type DatabaseExecutor = DatabaseClient | DatabaseTransaction;
