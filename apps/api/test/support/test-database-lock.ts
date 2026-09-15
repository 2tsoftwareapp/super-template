import { Client } from "pg";

/**
 * Advisory lock key that serialises every e2e process against the shared test database.
 *
 * Postgres keeps advisory locks in the shared lock table of the database they were taken
 * in, so every process has to take this key in the *test* database for it to exclude
 * anything. The value itself is arbitrary but must never change: a process using a
 * different key would happily reset the schema while another one is still running.
 */
const TEST_DATABASE_LOCK_KEY = 4_109_140_902;

const LOCK_STORE_KEY = "__superTemplateE2eTestDatabaseLock";

interface HeldLock {
  client: Client;
}

type LockStore = typeof globalThis & { [LOCK_STORE_KEY]?: HeldLock };

const lockStore = globalThis as LockStore;

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
 */
export const acquireTestDatabaseLock = async (databaseUrl: string): Promise<void> => {
  if (lockStore[LOCK_STORE_KEY]) {
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
