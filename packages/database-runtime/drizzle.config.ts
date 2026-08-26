import { loadEnvFiles } from "@repo/env-loader";
import { defineConfig } from "drizzle-kit";

loadEnvFiles();

if (!process.env.DATABASE_MIGRATE_URL && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_MIGRATE_URL or DATABASE_URL is required for Drizzle commands.");
}

/**
 * Schema sources are the feature packages' persistence folders. Migration SQL
 * is emitted into `apps/api/migrations` (the API host owns the migrate runner).
 */
export default defineConfig({
  schema: "../feature-*/src/infrastructure/persistence/**/*.ts",
  out: "../../apps/api/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_MIGRATE_URL ??
      process.env.DATABASE_URL ??
      "postgresql://localhost:5432/postgres",
  },
  strict: true,
  verbose: true,
});
