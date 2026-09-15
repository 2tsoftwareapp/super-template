import {
  ensureTestDatabaseExists,
  loadTestDatabaseEnv,
  resolveTestDatabaseAdminUrl,
  resolveTestDatabaseUrl,
} from "./test-database-env";
import { holdTestDatabaseLockForRun, RUN_SCOPE_LOCK_ENV_KEY } from "./test-database-lock";

/**
 * Run-scope database serialisation for `pnpm --filter api test:e2e`
 * (`vitest.e2e.config.ts`).
 *
 * The per-file advisory lock in `test-database-lock.ts` serialises one *file* at a time, so
 * two concurrent e2e processes still alternate file by file - each hand-over is a window
 * where one process resets `public` while the other is booting an app against it. Holding
 * the lock from before the first file until after the last one makes the second run wait
 * for the first run as a whole.
 *
 * Only the e2e config loads this file, so unit `test` and `test:coverage` runs never touch
 * the database: those suites have no `resetTestDatabase` call and must not need Postgres.
 */

let releaseRunScopeLock: (() => Promise<void>) | undefined;

export const setup = async (): Promise<void> => {
  // `loadTestDatabaseEnv` flips APP_ENV to "test" (that is how the suites pin the test
  // database). Worker processes inherit the environment, and the env-file cascade depends
  // on APP_ENV, so leaving it set here would change which files each worker layers
  // (`.env.test`/`.env` instead of `.env.development`/`.env`, and no `.env.local`). Put it
  // back so workers resolve their env exactly as they did before this globalSetup existed.
  const appEnvBeforeSetup = process.env.APP_ENV;

  loadTestDatabaseEnv();

  if (appEnvBeforeSetup === undefined) {
    delete process.env.APP_ENV;
  } else {
    process.env.APP_ENV = appEnvBeforeSetup;
  }

  const databaseUrl = resolveTestDatabaseUrl();
  const adminDatabaseUrl = resolveTestDatabaseAdminUrl();

  if (!databaseUrl || !adminDatabaseUrl) {
    throw new Error(
      "DATABASE_URL_TEST and DATABASE_URL_TEST_ADMIN are required for e2e runs. " +
        "Set them in .env (see docs/development.md) before running test:e2e.",
    );
  }

  // The lock only excludes peers that take the same key in the same database, and a fresh
  // checkout creates that database inside the first spec's `resetTestDatabase`. Create it
  // here so the lock, the specs, and the migrations all address the identical database.
  await ensureTestDatabaseExists(databaseUrl, adminDatabaseUrl);

  releaseRunScopeLock = await holdTestDatabaseLockForRun(adminDatabaseUrl);

  // Inherited by the forked worker processes. They own nothing: this process already
  // excludes peers for the whole run, so a worker taking the same key again would block on
  // this session until its hook timed out.
  process.env[RUN_SCOPE_LOCK_ENV_KEY] = "1";
};

export const teardown = async (): Promise<void> => {
  delete process.env[RUN_SCOPE_LOCK_ENV_KEY];
  await releaseRunScopeLock?.();
  releaseRunScopeLock = undefined;
};
