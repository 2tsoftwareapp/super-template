import { loadEnvFiles } from "@repo/env-loader";
import { defineConfig } from "drizzle-kit";

loadEnvFiles();

if (!process.env.DATABASE_MIGRATE_URL && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_MIGRATE_URL or DATABASE_URL is required for Drizzle commands.");
}

export default defineConfig({
  schema: "./src/schema/**/*.ts",
  out: "./drizzle",
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
