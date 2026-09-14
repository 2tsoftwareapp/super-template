#!/usr/bin/env node
/**
 * Self-check for the error-code ownership guard
 * (`scripts/check-error-codes.mjs` + `scripts/lib/error-code-policy.mjs`).
 *
 * The guard is only useful if it actually rejects the shapes it exists to
 * prevent, so the parsing/validation helpers are exercised against synthetic
 * source text here, and the real repository is asserted to pass through the CLI.
 *
 * Run with: node --test scripts/__tests__/error-code-policy.spec.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  LITERAL_CODE_EXCEPTIONS,
  findDuplicateOwners,
  findLiteralCodeUsages,
  findLiteralViolations,
  parseCatalog,
} from "../lib/error-code-policy.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");
const guard = join(repoRoot, "scripts/check-error-codes.mjs");

const catalog = (name, entries) =>
  `/** Domain-owned error codes. */\nexport const ${name} = {\n${entries
    .map(([key, value]) => `  ${key}: "${value}",`)
    .join("\n")}\n} as const;\n`;

test("parseCatalog reads the exported catalog keys and values", () => {
  const catalogs = parseCatalog(catalog("JOB_ERROR_CODES", [["JOB_NOT_FOUND", "JOB_NOT_FOUND"]]));

  assert.deepEqual(catalogs, [
    { name: "JOB_ERROR_CODES", codes: { JOB_NOT_FOUND: "JOB_NOT_FOUND" } },
  ]);
});

test("parseCatalog ignores a re-export of another package's catalog", () => {
  const source = 'export { SETTINGS_ERROR_CODES } from "@repo/api-kernel";\n';

  assert.deepEqual(parseCatalog(source), []);
});

test("findLiteralCodeUsages finds single-line and multi-line raise sites", () => {
  const source = [
    'throw new AppError("FILE_NOT_FOUND", "missing", HttpStatus.NOT_FOUND);',
    "throw new AppError(",
    '  "AUTH_FORBIDDEN",',
    '  "nope",',
    "  HttpStatus.FORBIDDEN,",
    ");",
  ].join("\n");

  assert.deepEqual(findLiteralCodeUsages(source), [
    { line: 1, code: "FILE_NOT_FOUND" },
    { line: 3, code: "AUTH_FORBIDDEN" },
  ]);
});

test("findDuplicateOwners flags a code two catalogs both declare", () => {
  const duplicates = findDuplicateOwners([
    { file: "a.ts", catalogName: "A_ERROR_CODES", codes: { USER_NOT_FOUND: "USER_NOT_FOUND" } },
    { file: "b.ts", catalogName: "B_ERROR_CODES", codes: { USER_NOT_FOUND: "USER_NOT_FOUND" } },
    { file: "b.ts", catalogName: "B_ERROR_CODES", codes: { B_ONLY: "B_ONLY" } },
  ]);

  assert.deepEqual(duplicates, [
    { code: "USER_NOT_FOUND", owners: ["a.ts#A_ERROR_CODES", "b.ts#B_ERROR_CODES"] },
  ]);
});

test("findLiteralViolations allows shared codes and rejects undeclared literals", () => {
  const source = {
    file: "packages/feature-demo/src/use-case.ts",
    text: [
      'throw new AppError("AUTH_FORBIDDEN", "no", HttpStatus.FORBIDDEN);',
      'throw new AppError("DEMO_NOT_FOUND", "no", HttpStatus.NOT_FOUND);',
    ].join("\n"),
  };

  const violations = findLiteralViolations(source, new Set(["AUTH_FORBIDDEN"]), []);

  assert.deepEqual(violations, [
    { file: "packages/feature-demo/src/use-case.ts", line: 2, code: "DEMO_NOT_FOUND" },
  ]);
});

test("findLiteralViolations honours a recorded exception for that exact file only", () => {
  const [exception] = LITERAL_CODE_EXCEPTIONS;
  const shared = new Set(["AUTH_FORBIDDEN"]);
  const text = `throw new AppError("${exception.code}", "no", HttpStatus.UNAUTHORIZED);`;

  assert.deepEqual(findLiteralViolations({ file: exception.file, text }, shared), []);
  assert.equal(
    findLiteralViolations({ file: "packages/feature-other/src/use-case.ts", text }, shared).length,
    1,
  );
});

test("the exception list is documented", () => {
  for (const exception of LITERAL_CODE_EXCEPTIONS) {
    assert.match(exception.code, /^[A-Z][A-Z0-9_]*$/);
    assert.ok(exception.file.startsWith("packages/feature-"), exception.file);
    assert.ok(exception.reason.length > 40, `exception ${exception.code} needs a real reason`);
  }
});

test("the repository itself passes the guard", () => {
  const result = spawnSync(process.execPath, [guard], { cwd: repoRoot, encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Error-code guard passed/);
});

test("the guard is wired into the policy gate", () => {
  const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const policy = readFileSync(join(repoRoot, "scripts/check-source-policy.sh"), "utf8");

  assert.match(manifest.scripts["lint:policy"], /scripts\/check-error-codes\.mjs/);
  assert.match(policy, /scripts\/check-error-codes\.mjs/);
});
