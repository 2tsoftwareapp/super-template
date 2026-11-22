import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString });

  return { db: drizzle(pool, { schema }), pool };
}

export type Database = ReturnType<typeof createDatabase>["db"];

/** The root database or an open transaction: both run the same queries. */
export type Executor = PgDatabase<NodePgQueryResultHKT, typeof schema>;
