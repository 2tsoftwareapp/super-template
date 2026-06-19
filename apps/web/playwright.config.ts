import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(__dirname, "../../.env"), quiet: true });

const webPort = process.env.WEB_PORT ?? "3000";
const apiPort = process.env.API_PORT ?? "3001";
const postgresPort = process.env.POSTGRES_EXPOSED_PORT ?? process.env.POSTGRES_PORT ?? "5432";

const databaseUrl =
  process.env.PLAYWRIGHT_DATABASE_URL ??
  `postgresql://fullstack_starter_app:fullstack_starter_app@localhost:${postgresPort}/fullstack_starter`;

const migrateUrl =
  process.env.PLAYWRIGHT_DATABASE_MIGRATE_URL ??
  `postgresql://postgres:postgres@localhost:${postgresPort}/fullstack_starter`;

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${webPort}`;
const apiHealthUrl =
  process.env.PLAYWRIGHT_API_HEALTH_URL ??
  `http://localhost:${apiPort}/api/v1/health`;

// Create clean environment for API without test-specific database URLs
const apiEnv = { ...process.env };
delete apiEnv.DATABASE_URL_TEST;
delete apiEnv.DATABASE_URL_TEST_ADMIN;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: !process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? [
        {
          command: "pnpm --filter api dev",
          cwd: resolve(__dirname, "../.."),
          url: apiHealthUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          env: {
            ...apiEnv,
            APP_ENV: "development",
            DATABASE_URL: databaseUrl,
            DATABASE_MIGRATE_URL: migrateUrl,
            NODE_ENV: "development",
          },
        },
        {
          command: "pnpm --filter web dev",
          cwd: resolve(__dirname, "../.."),
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          env: {
            ...process.env,
          },
        },
      ]
    : undefined,
});
