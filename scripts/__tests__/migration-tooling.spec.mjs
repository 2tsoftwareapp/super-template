#!/usr/bin/env node
/**
 * Guardrails for the migration tooling.
 *
 * These are fast, filesystem-only assertions. They exist because two defects
 * made `make db-generate` unusable and both were invisible until someone ran it:
 *
 *   1. A non-snapshot JSON file inside migrations/meta/ — drizzle-kit parses
 *      every meta/ entry that does not start with "_" as a snapshot and aborts
 *      with "data is malformed".
 *   2. A schema glob wider than the canonical persistence entry points —
 *      drizzle-kit then bundles repositories/DTOs and fails on NestJS parameter
 *      decorators.
 *
 * A third assertion keeps drizzle's numbering ahead of the filename ledger so a
 * generated migration cannot collide with an existing NNNN_*.sql file.
 *
 * Run with: node --test scripts/__tests__/migration-tooling.spec.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const migrationsDir = join(repoRoot, "apps/api/migrations");
const metaDir = join(migrationsDir, "meta");
const packagesDir = join(repoRoot, "packages");
const drizzleConfig = join(packagesDir, "database-runtime/drizzle.config.ts");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Expand a path glob segment by segment. Only `*` wildcards are supported,
 * which is all drizzle.config.ts uses.
 * @param {string} pattern
 * @returns {string[]} existing files
 */
function expandGlob(pattern) {
  let current = ["/"];
  for (const segment of resolve(packagesDir, "database-runtime", pattern).split("/")) {
    if (!segment) continue;
    const next = [];
    for (const directory of current) {
      if (!segment.includes("*")) {
        next.push(join(directory, segment));
        continue;
      }
      if (!existsSync(directory)) continue;
      const matcher = new RegExp(`^${segment.split("*").map(escapeRegExp).join(".*")}$`);
      for (const entry of readdirSync(directory)) {
        if (matcher.test(entry)) next.push(join(directory, entry));
      }
    }
    current = next;
  }
  return current.filter((file) => existsSync(file) && statSync(file).isFile());
}

/** The schema entry files check-schema.mjs treats as canonical. */
function canonicalSchemaFiles() {
  const result = [];
  for (const feature of readdirSync(packagesDir)) {
    if (!feature.startsWith("feature-")) continue;
    for (const candidate of [
      `${feature}/src/infrastructure/persistence/index.ts`,
      `${feature}/src/infrastructure/persistence/outbox-messages.ts`,
    ]) {
      const full = join(packagesDir, candidate);
      // check-schema.mjs only picks outbox-messages.ts for feature-outbox, which
      // has no index.ts, so both patterns together describe the canonical set.
      if (existsSync(full)) result.push(full);
    }
  }
  return result.sort();
}

function schemaGlobsFromConfig() {
  const source = readFileSync(drizzleConfig, "utf8");
  const arrayMatch = source.match(/schema:\s*\[([\s\S]*?)\]/);
  if (!arrayMatch) {
    const single = source.match(/schema:\s*"([^"]+)"/);
    assert.ok(single, "drizzle.config.ts must declare a schema entry");
    return [single[1]];
  }
  return [...arrayMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

test("migrations/meta has no file drizzle-kit would mistake for a snapshot", () => {
  const offenders = readdirSync(metaDir).filter(
    (name) =>
      !name.startsWith("_") && !(name.endsWith(".json") && /^\d{4}_snapshot\.json$/.test(name)),
  );
  assert.deepEqual(
    offenders,
    [],
    `Found ${offenders.join(", ")}. drizzle-kit parses every non-underscore file in meta/ as a snapshot and fails with "data is malformed". Prefix it with "_".`,
  );
});

test("drizzle.config.ts schema globs resolve to exactly the canonical persistence files", () => {
  const expanded = schemaGlobsFromConfig()
    .flatMap(expandGlob)
    .map((file) => relative(repoRoot, file))
    .sort();
  const canonical = canonicalSchemaFiles().map((file) => relative(repoRoot, file));
  assert.deepEqual(
    expanded,
    canonical,
    "drizzle.config.ts and scripts/check-schema.mjs must agree on the schema entry points. Widening the glob makes drizzle-kit bundle decorated NestJS classes and fail.",
  );
});

test("drizzle journal numbering stays ahead of the filename ledger", () => {
  const journal = JSON.parse(readFileSync(join(metaDir, "_journal.json"), "utf8"));
  const lastJournalIdx = Math.max(...journal.entries.map((entry) => entry.idx));
  const lastLedgerIdx = Math.max(
    ...readdirSync(migrationsDir)
      .filter((file) => /^\d{4}_.*\.sql$/.test(file))
      .map((file) => Number(file.slice(0, 4))),
  );
  // Equality, not just ">=": a journal entry that outruns the ledger means a
  // generated migration was cleaned up but its journal entry was left behind
  // (an orphan). A journal entry that trails the ledger means a hand-written
  // SQL file was added without recording it in _journal.json, so the next
  // generated migration would reuse that number.
  assert.equal(
    lastJournalIdx,
    lastLedgerIdx,
    `Journal ends at ${lastJournalIdx} but the ledger reaches ${lastLedgerIdx}. ` +
      (lastJournalIdx > lastLedgerIdx
        ? "A journal entry has no corresponding SQL file — remove the orphan entry."
        : "Add a _journal.json entry for the newest SQL file so generated migrations do not reuse its number."),
  );
});
