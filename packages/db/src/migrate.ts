import { resolve } from "node:path";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDatabase } from "./client";

/** `migrations/` sits next to both `src/` (tsx) and `dist/` (the production bundle). */
const migrationsFolder = process.env.MIGRATIONS_DIR ?? resolve(__dirname, "../migrations");

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to migrate");
  }

  const { db, pool } = createDatabase(databaseUrl);

  try {
    await migrate(db, { migrationsFolder });
    console.log(`migrations applied from ${migrationsFolder}`);
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
