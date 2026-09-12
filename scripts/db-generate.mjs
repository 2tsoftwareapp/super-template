#!/usr/bin/env node
/**
 * Generate the next SQL migration and keep the migration ledger consistent.
 *
 * `make db-generate` used to leave the repository in a half-finished state:
 * drizzle-kit emitted the SQL and the snapshot, but nothing recorded the new
 * file in the filename ledger (`meta/_legacy-journal-map.json`) or sealed its
 * checksum (`meta/_migration-integrity.json`), so `scripts/check-schema.mjs`
 * failed on the very next run and users had to patch two JSON files by hand.
 *
 * This wrapper performs the whole flow:
 *   1. Run `drizzle-kit generate` (diffs canonical schemas vs the last snapshot).
 *   2. Append any new SQL file to the legacy journal map.
 *   3. Seal the new checksums via `check-schema.mjs --generate`.
 *
 * Usage:
 *   node scripts/db-generate.mjs
 *   node scripts/db-generate.mjs --migrations <dir>
 *   node scripts/db-generate.mjs --name <slug>     # drizzle-kit --name passthrough
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
function flagValue(name) {
  const index = argv.indexOf(name);
  return index !== -1 && index + 1 < argv.length ? argv[index + 1] : null;
}

const migrationsDir = resolve(flagValue("--migrations") ?? join(root, "apps/api/migrations"));
const nameSlug = flagValue("--name");
const runtimeDir = join(root, "packages/database-runtime");
const journalMapPath = join(migrationsDir, "meta", "_legacy-journal-map.json");

function fail(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function run(command, args, cwd, stdio = "inherit") {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd, stdio });
    child.on("close", (code) => resolveRun(code ?? 1));
  });
}

function sqlFiles() {
  if (!existsSync(migrationsDir)) return [];
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

if (!existsSync(migrationsDir)) {
  fail(`Migrations directory not found: ${migrationsDir}`);
}

const before = new Set(sqlFiles());

// --- 1. Diff the canonical schemas against the latest committed snapshot. ---
const drizzle = join(runtimeDir, "node_modules", ".bin", "drizzle-kit");
const drizzleArgs = ["generate", "--config", "drizzle.config.ts"];
if (nameSlug) drizzleArgs.push("--name", nameSlug);

let code;
if (existsSync(drizzle)) {
  code = await run(drizzle, drizzleArgs, runtimeDir);
} else {
  // Fall back to pnpm when node_modules has not been linked yet.
  code = await run(
    "pnpm",
    ["--filter", "@repo/database-runtime", "exec", "drizzle-kit", ...drizzleArgs],
    root,
  );
}
if (code !== 0) fail(`drizzle-kit generate failed with exit code ${code}.`, code);

const added = sqlFiles().filter((file) => !before.has(file));

if (added.length === 0) {
  process.stdout.write("\nNo new SQL migration was generated — nothing to record.\n");
  process.exit(0);
}

// --- 2. Record the new file(s) in the filename ledger. ---
const ledger = existsSync(journalMapPath)
  ? JSON.parse(readFileSync(journalMapPath, "utf8"))
  : { version: 1, files: [] };
const files = [...new Set([...(ledger.files ?? []), ...added])].sort();
writeFileSync(journalMapPath, `${JSON.stringify({ ...ledger, files }, null, 2)}\n`);
process.stdout.write(`Recorded in _legacy-journal-map.json: ${added.join(", ")}\n`);

// --- 3. Seal the new checksums so the history stays append-only. ---
code = await run(
  process.execPath,
  [join(root, "scripts", "check-schema.mjs"), "--generate", "--migrations", migrationsDir],
  root,
);
if (code !== 0) fail(`check-schema.mjs --generate failed with exit code ${code}.`, code);

process.stdout.write(
  `\nDone. Review the generated SQL, then run \`make db-migrate\` and \`node scripts/check-schema.mjs\`.\n`,
);
