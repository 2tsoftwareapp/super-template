import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "drizzle-kit";

const rootEnv = resolve(__dirname, "../../.env");

// Variables already exported in the shell win over the file.
if (existsSync(rootEnv)) {
  process.loadEnvFile(rootEnv);
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
