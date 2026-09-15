#!/usr/bin/env node
/**
 * Error-code ownership guard.
 *
 * Enforces the three-tier error-code rule documented in
 * `docs/architecture/ARCHITECTURE_RULES.md` §15.2 / `CODING_RULES.md` §11.7:
 *
 *   1. every code value has exactly one owning catalog;
 *   2. a code raised as a bare string literal belongs to a shared tier
 *      (transport `ERROR_CODES` in `@repo/api-runtime`, or a kernel-shared
 *      catalog in `@repo/api-kernel`), or is a recorded exception
 *      (`scripts/lib/error-code-policy.mjs`).
 *
 * Scope: the shared catalogs, every feature `src/public/error-codes.ts`
 * catalog, and `new AppError(...)` raise sites under `packages/feature-<id>/src`
 * and `apps/api/src`. Frontend/BFF error payloads are out of scope — they are
 * not `AppError` raise sites.
 *
 * The rule and its rationale live in the policy module; this file only walks
 * the repository and reports.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import {
  LITERAL_CODE_EXCEPTIONS,
  findDuplicateOwners,
  findLiteralViolations,
  parseCatalog,
} from "./lib/error-code-policy.mjs";

const repoRoot = process.cwd();
const PACKAGES_DIR = join(repoRoot, "packages");
const TRANSPORT_CATALOG = "packages/api-runtime/src/error-codes.ts";
const KERNEL_CATALOG = "packages/api-kernel/src/errors/feature-error-codes.ts";
const LITERAL_SCAN_ROOTS = ["packages", "apps/api/src"];

const failures = [];

const read = (file) => readFileSync(join(repoRoot, file), "utf8");

/** Every `*.ts` file under a path, skipping tests and build output. */
function sourceFiles(target) {
  const absolute = join(repoRoot, target);
  if (!statSync(absolute).isDirectory()) return [target];
  const files = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (["node_modules", "dist", "coverage", ".turbo"].includes(entry.name)) continue;
    const child = join(target, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(child));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts")) files.push(child);
  }
  return files;
}

// 1. Collect the shared tiers and every feature-owned catalog.
const sharedFiles = [TRANSPORT_CATALOG, KERNEL_CATALOG];
const featureCatalogFiles = readdirSync(PACKAGES_DIR)
  .filter((name) => name.startsWith("feature-"))
  .map((name) => `packages/${name}/src/public/error-codes.ts`)
  .filter((file) => {
    try {
      return statSync(join(repoRoot, file)).isFile();
    } catch {
      return false;
    }
  })
  .sort();

const declarations = [];
for (const file of [...sharedFiles, ...featureCatalogFiles]) {
  const catalogs = parseCatalog(read(file));
  if (catalogs.length === 0 && sharedFiles.includes(file)) {
    failures.push(`Error-code guard failed: ${file} declares no \`as const\` catalog.`);
    continue;
  }
  for (const catalog of catalogs)
    declarations.push({ file, catalogName: catalog.name, codes: catalog.codes });
}

const sharedCodes = new Set(
  declarations.filter((d) => sharedFiles.includes(d.file)).flatMap((d) => Object.values(d.codes)),
);

// 2. Every code value has exactly one owner.
for (const { code, owners } of findDuplicateOwners(declarations)) {
  failures.push(`Error-code guard failed: ${code} is declared by ${owners.join(" and ")}.`);
}

// 3. No bare literal outside the shared tiers.
const literalRoots = LITERAL_SCAN_ROOTS.flatMap((root) =>
  root === "packages"
    ? readdirSync(PACKAGES_DIR)
        .filter((name) => name.startsWith("feature-"))
        .map((name) => `packages/${name}/src`)
    : [root],
);

let disallowedLiterals = 0;
for (const root of literalRoots) {
  for (const file of sourceFiles(root)) {
    const violations = findLiteralViolations({ file, text: read(file) }, sharedCodes);
    disallowedLiterals += violations.length;
    for (const { line, code } of violations) {
      failures.push(
        `Error-code guard failed: ${file}:${line} raises the literal "${code}". ` +
          `Declare it in one catalog (transport, kernel-shared, or the owning feature's ` +
          `public/error-codes.ts) and reference the constant.`,
      );
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  process.exit(1);
}

const exceptionNames = LITERAL_CODE_EXCEPTIONS.map(
  (e) => `${e.code} (${relative(repoRoot, e.file)})`,
);
console.log(
  `Error-code guard passed. ${declarations.length} catalogs, ${sharedCodes.size} shared codes, ` +
    `${disallowedLiterals} disallowed literal raise site(s), ${LITERAL_CODE_EXCEPTIONS.length} recorded exception(s)` +
    `${exceptionNames.length ? `: ${exceptionNames.join(", ")}` : ""}.`,
);
