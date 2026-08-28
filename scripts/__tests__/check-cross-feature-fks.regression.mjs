#!/usr/bin/env node
/**
 * Regression for scripts/check-cross-feature-fks.mjs.
 *
 * 1. Snapshot the current `organization-members.ts`.
 * 2. Replace the `userId` column with a plain `uuid("user_id").notNull()`.
 * 3. Run the guard. It MUST exit non-zero.
 * 4. Restore the original file.
 * 5. Run the guard again. It MUST exit zero.
 *
 * This proves the guard rejects a bare `uuid(...).notNull()` declaration and
 * accepts a canonical `.references(() => users.id, { onDelete: "cascade" })`
 * chain. The test is skipped if the snapshot cannot be obtained.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const target = resolve(
  repoRoot,
  "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
);
const guard = resolve(repoRoot, "scripts/check-cross-feature-fks.mjs");

const original = readFileSync(target, "utf8");
let failed = false;

const runGuard = () => {
  try {
    execFileSync("node", [guard], { stdio: "pipe", cwd: repoRoot });
    return 0;
  } catch (err) {
    return err.status ?? 1;
  }
};

try {
  // 1. Sanity: guard passes on the canonical schema.
  if (runGuard() !== 0) {
    console.error(
      "FK guard regression precondition failed: canonical schema does not pass the guard.",
    );
    process.exit(1);
  }

  // 2. Replace the canonical .references chain with a plain uuid().notNull()
  //    declaration and run the guard. It MUST fail.
  const tampered = original.replace(
    /userId:\s*uuid\("user_id"\)\s*\n?\s*\.notNull\(\)\s*\n?\s*\.references\(\(\) => users\.id, \{ onDelete: "cascade" \}\),?\n?/,
    "userId: uuid(\"user_id\").notNull(),\n",
  );
  if (tampered === original) {
    console.error("FK guard regression setup failed: could not rewrite userId declaration.");
    process.exit(1);
  }
  writeFileSync(target, tampered);

  const failCode = runGuard();
  if (failCode === 0) {
    console.error(
      "FK guard regression FAILED: guard accepted a plain uuid(\"...\").notNull() declaration without .references().",
    );
    failed = true;
  } else {
    console.log(
      "FK guard regression OK: guard correctly rejected the tampered schema (exit " + failCode + ").",
    );
  }
} finally {
  // 4. Restore the canonical file (always, even on early exit).
  writeFileSync(target, original);
}

// 5. Re-run after restore.
if (runGuard() !== 0) {
  console.error("FK guard regression FAILED: guard did not pass after restoring canonical schema.");
  failed = true;
}

if (failed) {
  process.exit(1);
}
console.log("FK guard regression passed.");
