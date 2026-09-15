import baseConfig from "./vitest.config";
import { defineConfig } from "vitest/config";

/**
 * E2E configuration for `pnpm --filter api test:e2e`.
 *
 * Differences from the shared `vitest.config.ts` (whose resolution aliases are reused by
 * spreading it, so the two cannot drift):
 *
 * - `include` narrows to e2e files. This overrides, rather than merges with, the shared
 *   pattern, so an e2e run can never pick up a unit spec.
 * - `globalSetup` takes the test-database advisory lock for the whole run, which is what
 *   makes two concurrent e2e processes queue instead of interleaving file by file (NEW-14).
 *   It is deliberately absent from the unit and coverage runs: those never touch Postgres.
 * - `maxWorkers: 1` is restated because the e2e suite's contract is one file at a time -
 *   every file drops and rebuilds the same `public` schema.
 *
 * `hookTimeout` and `testTimeout` are inherited unchanged from the shared config (120s /
 * 30s); the e2e schema reset and Nest app boot need the larger hook budget.
 */
export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ["test/**/*.e2e.spec.ts"],
    globalSetup: ["./test/support/e2e-run-lock.global-setup.ts"],
    maxWorkers: 1,
  },
});
