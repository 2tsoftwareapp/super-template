import { Client } from "pg";

/**
 * Advisory lock key that serialises every e2e process against the shared test database.
 *
 * Postgres keeps advisory locks in the shared lock table of the database they were taken
 * in, so every process has to take this key in the *test* database for it to exclude
 * anything. The value itself is arbitrary but must never change: a process using a
 * different key would happily reset the schema while another one is still running.
 *
 * `apps/worker/test/support/test-database-lock.ts` keeps a hand-synced copy of this key
 * (turbo boundaries rejects a relative import across apps), so the two files must stay
 * byte-for-byte identical on the key.
 */
export const TEST_DATABASE_LOCK_KEY = 4_109_140_902;

/**
 * Set to `"1"` by the e2e run-scope globalSetup while this run holds the lock for its whole
 * duration. Worker processes inherit the variable when Vitest forks them, and they must not
 * take the same key again: the run-scope holder is a *different session*, so a worker asking
 * for the lock a second time would wait on its own parent until the hook timeout expires.
 */
export const RUN_SCOPE_LOCK_ENV_KEY = "SUPER_TEMPLATE_E2E_RUN_SCOPE_LOCK";

const LOCK_STORE_KEY = "__superTemplateE2eTestDatabaseLock";
const RUN_SCOPE_STORE_KEY = "__superTemplateE2eRunScopeTestDatabaseLock";

/** Marks the run-scope holder's session so `pg_stat_activity` names the waiter it is blocking. */
const RUN_SCOPE_APPLICATION_NAME = "super-template-e2e-run-lock";

interface HeldLock {
  client: Client;
}

type LockStore = typeof globalThis & {
  [LOCK_STORE_KEY]?: HeldLock;
  [RUN_SCOPE_STORE_KEY]?: HeldLock;
};

const lockStore = globalThis as LockStore;

export const isRunScopeLockHeld = (): boolean => process.env[RUN_SCOPE_LOCK_ENV_KEY] === "1";

/**
 * Takes an exclusive, session-level advisory lock on the shared test database and keeps
 * it for the lifetime of this process.
 *
 * `resetTestDatabase` drops the entire `public` schema, so a second e2e process resetting
 * concurrently rips tables out from under the first one's running app. Observed without
 * this lock: `relation "m_users" does not exist`, `tuple concurrently updated` inside the
 * role-grant helper, `deadlock detected`, and 500s on unrelated requests. Waiting here
 * turns that corruption into a short queue.
 *
 * Vitest runs every test file in its own process, and this lock is released when that
 * process exits - which is after the file's tests - so the schema of a file under test is
 * never dropped by a peer. That is the property that matters: `pg_try_advisory_lock`
 * returns false for a fresh session for as long as a peer is still testing.
 *
 * The handle lives on `globalThis` so that repeated `resetTestDatabase` calls inside one
 * process reuse a single session: advisory locks are re-entrant per session, but a second
 * session in the same process would block on a lock the process already owns.
 *
 * A run-scope holder (see `holdTestDatabaseLockForRun`) already excludes every peer for the
 * whole run, so per-file locking is redundant inside that run and is skipped here.
 */
export const acquireTestDatabaseLock = async (databaseUrl: string): Promise<void> => {
  if (lockStore[LOCK_STORE_KEY] || isRunScopeLockHeld()) {
    return;
  }

  const client = new Client({ connectionString: databaseUrl });

  // Without a listener, a connection-level failure is reported as an unhandled "error"
  // event and kills the worker with no context. Surface it instead of swallowing it.
  client.on("error", (error: Error) => {
    console.warn(`[e2e] test database lock connection error: ${error.message}`);
  });

  await client.connect();

  const { rows } = await client.query<{ acquired: boolean }>(
    "select pg_try_advisory_lock($1::bigint) as acquired",
    [TEST_DATABASE_LOCK_KEY],
  );

  if (!rows[0]?.acquired) {
    console.log(
      "[e2e] test database is in use by another e2e process; waiting for it to release the schema",
    );
    await client.query("select pg_advisory_lock($1::bigint)", [TEST_DATABASE_LOCK_KEY]);
    console.log("[e2e] test database lock acquired, continuing");
  }

  lockStore[LOCK_STORE_KEY] = { client };
};

/**
 * Takes the same advisory lock, in the same database, but keeps it for the whole Vitest run
 * instead of one file, and returns the function that releases it.
 *
 * Per-file locking made two concurrent `test:e2e` processes interleave: each one holds the
 * lock only while its current file's worker is alive, so A runs file 1, B runs file 1, A
 * runs file 2, ... and every hand-over is a window where a peer's schema reset can land
 * inside another process's setup. Holding the lock from `globalSetup` until teardown makes
 * the second run wait for the *entire* first run, which removes the interleaving instead of
 * shortening it.
 *
 * The caller (the globalSetup) exports `RUN_SCOPE_LOCK_ENV_KEY=1` so worker processes skip
 * the per-file lock rather than deadlock against their own parent's session.
 */
export const holdTestDatabaseLockForRun = async (
  databaseUrl: string,
): Promise<() => Promise<void>> => {
  if (lockStore[RUN_SCOPE_STORE_KEY]) {
    throw new Error("The run-scope test database lock is already held in this process.");
  }

  const client = new Client({
    connectionString: databaseUrl,
    application_name: RUN_SCOPE_APPLICATION_NAME,
  });

  client.on("error", (error: Error) => {
    console.warn(`[e2e] run-scope test database lock connection error: ${error.message}`);
  });

  await client.connect();

  const startedAt = Date.now();
  const { rows } = await client.query<{ acquired: boolean }>(
    "select pg_try_advisory_lock($1::bigint) as acquired",
    [TEST_DATABASE_LOCK_KEY],
  );

  if (rows[0]?.acquired) {
    console.log("[e2e] run-scope test database lock acquired; this run owns the test database");
  } else {
    console.log(
      "[e2e] another e2e run holds the test database lock; waiting for that run to finish before this one starts",
    );
    await client.query("select pg_advisory_lock($1::bigint)", [TEST_DATABASE_LOCK_KEY]);
    const waitedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(
      `[e2e] run-scope test database lock acquired after waiting ${waitedSeconds}s for the previous run`,
    );
  }

  lockStore[RUN_SCOPE_STORE_KEY] = { client };

  let released = false;
  return async (): Promise<void> => {
    if (released) {
      return;
    }
    released = true;

    try {
      await client.query("select pg_advisory_unlock($1::bigint)", [TEST_DATABASE_LOCK_KEY]);
    } catch (error) {
      // The lock is released by Postgres the moment the session ends, so a failed explicit
      // unlock is not worth failing the run over - the connection close below is enough.
      console.warn(
        `[e2e] run-scope test database lock could not be released explicitly: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      await client.end().catch(() => undefined);
      delete lockStore[RUN_SCOPE_STORE_KEY];
    }

    console.log("[e2e] run-scope test database lock released");
  };
};
