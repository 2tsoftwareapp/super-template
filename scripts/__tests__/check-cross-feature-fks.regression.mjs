#!/usr/bin/env node
/**
 * Standalone regression for the cross-feature FK guard that exercises the
 * pure validator without mutating tracked production source files.
 *
 * Run via: `node scripts/__tests__/check-cross-feature-fks.regression.mjs`
 *
 * This wraps the same vitest suite the CI runs, but as a plain Node script
 * so it can be invoked from the `lint:policy` script chain (alongside
 * scripts/check-cross-feature-fks.mjs) without requiring vitest to be
 * installed in the caller's path.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const spec = resolve(repoRoot, "scripts", "__tests__", "cross-feature-fk-validator.spec.ts");

const result = spawnSync(
  "pnpm",
  ["exec", "vitest", "run", spec],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
