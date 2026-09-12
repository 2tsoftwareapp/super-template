import { loadEnvFiles } from "@repo/env-loader";
import { defineConfig } from "drizzle-kit";

loadEnvFiles();

if (!process.env.DATABASE_MIGRATE_URL && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_MIGRATE_URL or DATABASE_URL is required for Drizzle commands.");
}

/**
 * Schema sources are the feature packages' persistence folders. Migration SQL
 * is emitted into `apps/api/migrations` (the API host owns the migrate runner).
 *
 * IMPORTANT: this glob must stay limited to the canonical persistence entry
 * points. A wider glob such as `persistence/**\/*.ts` also picks up
 * repositories and DTOs, which drizzle-kit bundles with esbuild and then fails
 * on with "Parameter decorators only work when experimental decorators are
 * enabled". Keep this list in sync with the schema file filter in
 * `scripts/check-schema.mjs` — that script is the source of truth.
 */
export default defineConfig({
  schema: [
    "../feature-*/src/infrastructure/persistence/index.ts",
    "../feature-outbox/src/infrastructure/persistence/outbox-messages.ts",
  ],
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
