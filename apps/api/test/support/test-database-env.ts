import { loadEnvFiles } from "@repo/env-loader";
import { Pool } from "pg";

/**
 * Test database identity and URL resolution shared by the e2e suites and the
 * run-scope lock globalSetup.
 *
 * Both sides must agree on *which* database they address: the run-scope advisory lock is
 * taken in the test database, and Postgres only excludes sessions that take the same key in
 * that same database. Deriving the URL twice (once per entry point) is how the two would
 * silently drift apart, so the derivation lives here.
 */

/** Restricted application role every e2e suite must connect through (RLS enforced). */
export const TEST_APP_ROLE_NAME = "fullstack_starter_app";
export const TEST_APP_ROLE_PASSWORD = "fullstack_starter_app";
export const TEST_DATABASE_NAME = "fullstack_starter_test";

export const buildDatabaseUrl = (role: string, password: string, database: string): string => {
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";

  return `postgresql://${encodeURIComponent(role)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

/** Keep e2e on the restricted app role even when a stale .env still points at postgres. */
export const configureTestDatabaseUrls = (): void => {
  process.env.APP_ENV = "test";

  const appTestUrl = buildDatabaseUrl(
    TEST_APP_ROLE_NAME,
    TEST_APP_ROLE_PASSWORD,
    TEST_DATABASE_NAME,
  );
  const adminTestUrl = buildDatabaseUrl(
    process.env.POSTGRES_USER ?? "postgres",
    process.env.POSTGRES_PASSWORD ?? "postgres",
    TEST_DATABASE_NAME,
  );

  const currentTestUrl = process.env.DATABASE_URL_TEST;
  const usesPrivilegedTestRole =
    !currentTestUrl ||
    /\/\/postgres[:@]/i.test(currentTestUrl) ||
    !currentTestUrl.includes(`${TEST_APP_ROLE_NAME}@`);

  if (usesPrivilegedTestRole) {
    process.env.DATABASE_URL_TEST = appTestUrl;
  }

  // Always derive the admin URL from POSTGRES_HOST/PORT instead of trusting whatever
  // is already in process.env: loadEnvFiles() falls back to .env.example for keys
  // .env doesn't set, and .env.example's DATABASE_URL_TEST_ADMIN hardcodes the
  // placeholder port 5432, which silently points migrations/reset at the wrong
  // Postgres instance whenever the real .env uses a different POSTGRES_PORT.
  process.env.DATABASE_URL_TEST_ADMIN = adminTestUrl;
};

export const resolveTestDatabaseUrl = (): string | undefined => process.env.DATABASE_URL_TEST;

export const resolveTestDatabaseAdminUrl = (): string | undefined =>
  process.env.DATABASE_URL_TEST_ADMIN ?? process.env.DATABASE_URL_TEST;

/** Loads the env-file cascade and pins DATABASE_URL_TEST* at the local test database. */
export const loadTestDatabaseEnv = (): void => {
  loadEnvFiles();
  configureTestDatabaseUrls();
};

/** Creates the test database when a fresh checkout does not have it yet. */
export const ensureTestDatabaseExists = async (
  databaseUrl: string,
  adminDatabaseUrl: string,
): Promise<void> => {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("Test database name could not be resolved");
  }

  const adminUrl = new URL(adminDatabaseUrl);
  adminUrl.pathname = "/postgres";

  const adminPool = new Pool({
    connectionString: adminUrl.toString(),
  });

  try {
    const result = await adminPool.query<{ exists: boolean }>(
      'select exists(select 1 from pg_database where datname = $1) as "exists"',
      [databaseName],
    );

    if (!result.rows[0]?.exists) {
      const safeDatabaseName = `"${databaseName.replace(/"/g, '""')}"`;
      await adminPool.query(`create database ${safeDatabaseName}`);
    }
  } finally {
    await adminPool.end();
  }
};
