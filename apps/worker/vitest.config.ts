import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Every test file gets its own process, but they all talk to the single
    // `fullstack_starter_test` database, so running them concurrently only adds lock
    // contention. One worker keeps the reset ordering obvious.
    maxWorkers: 1,
    // `worker-processing.e2e.spec.ts` rebuilds the shared test database in its `beforeAll`:
    // it creates the database and role, drops and recreates `public`, replays every
    // migration, seeds it through the API CLI, and then boots two Nest application
    // contexts. That is seconds of work when nothing competes, but the schema drop needs
    // ACCESS EXCLUSIVE locks and the reset first queues on the same advisory lock that
    // `apps/api/test` holds, so the hook can wait for another e2e process to finish a
    // whole file. Vitest's implicit 10s budget cut that setup short; the spec asks for
    // 120s by hand and apps/api/vitest.config.ts uses 120s, so both e2e suites share one
    // documented budget.
    hookTimeout: 120_000,
    // Deliberately left at the API suite's value: the tests themselves drive fast local
    // handlers, and a stuck job is a real failure rather than a slow setup step.
    testTimeout: 30_000,
    include: ["test/**/*.{test,spec}.ts", "src/**/*.spec.ts"],
  },
});
