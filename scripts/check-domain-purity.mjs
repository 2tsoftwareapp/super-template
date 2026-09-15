#!/usr/bin/env node
/**
 * Domain-layer purity guard.
 *
 * ADR 0001 rule 1: a feature's `domain/` code is framework-free — no **value**
 * imports from `@nestjs/*`, `drizzle-orm`, `express`, or
 * `@repo/database-runtime`. Type-only imports are allowed (they carry no
 * runtime coupling), as are `@repo/api-kernel` / `@repo/api-runtime`.
 *
 * Scope: every `domain/` directory of every feature package, i.e.
 * `packages/feature-<id>/src/domain/**` and
 * `packages/feature-<id>/src/**\/domain/**` (nested slices such as
 * `feature-upload/src/files/domain/`). Specs are out of scope: a domain spec
 * may import test doubles.
 *
 * The policy itself lives in `scripts/lib/domain-purity-policy.mjs` (pure, and
 * covered by `scripts/__tests__/domain-purity-policy.spec.mjs`); this file only
 * walks the repository and reports. It is wired into
 * `scripts/check-source-policy.sh`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { findDomainPurityViolations } from "./lib/domain-purity-policy.mjs";

const repoRoot = process.cwd();
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", "coverage", ".turbo"]);

/** Every file under `directory` whose path contains a `domain/` segment. */
function domainFiles(directory, withinDomain = false) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const child = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...domainFiles(child, withinDomain || entry.name === "domain"));
      continue;
    }
    if (!withinDomain || !entry.name.endsWith(".ts")) continue;
    if (entry.name.endsWith(".spec.ts") || entry.name.endsWith(".test.ts")) continue;
    files.push(child);
  }
  return files;
}

const featurePackages = readdirSync(join(repoRoot, "packages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("feature-"))
  .map((entry) => join(repoRoot, "packages", entry.name))
  .filter((directory) => {
    try {
      return statSync(join(directory, "package.json")).isFile();
    } catch {
      return false;
    }
  })
  .sort();

const failures = [];
let checked = 0;
for (const directory of featurePackages) {
  for (const file of domainFiles(directory)) {
    checked += 1;
    const relative = file.slice(repoRoot.length + 1);
    for (const violation of findDomainPurityViolations(relative, readFileSync(file, "utf8"))) {
      failures.push(
        `Domain purity guard failed: ${relative}:${violation.line}:${violation.column} is a ` +
          `${violation.kind} of "${violation.specifier}". A domain file must stay framework-free ` +
          `(ADR 0001 rule 1); use \`import type\` and keep the value at the port/adapter boundary.`,
      );
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

console.log(
  `Domain purity guard passed. ${checked} domain file(s) across ${featurePackages.length} feature package(s) are framework-free.`,
);
