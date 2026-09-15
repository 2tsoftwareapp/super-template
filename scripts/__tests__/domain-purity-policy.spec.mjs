#!/usr/bin/env node
/**
 * Self-check for the domain-purity guard
 * (`scripts/check-domain-purity.mjs` + `scripts/lib/domain-purity-policy.mjs`).
 *
 * The guard is only useful if it rejects the shapes ADR 0001 forbids and
 * accepts the ones it allows, so the policy helpers are exercised against
 * synthetic source text here, the CLI is exercised against a temporary probe
 * package, and the real repository is asserted to pass.
 *
 * Run with: node --test scripts/__tests__/domain-purity-policy.spec.mjs
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

import {
  FORBIDDEN_DOMAIN_MODULES,
  findDomainPurityViolations,
  isForbiddenDomainSpecifier,
} from "../lib/domain-purity-policy.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");
const guard = join(repoRoot, "scripts/check-domain-purity.mjs");

const violationsOf = (source) => findDomainPurityViolations("probe.ts", source);

test("the forbidden list is exactly the ADR 0001 rule 1 list", () => {
  assert.deepEqual(
    [...FORBIDDEN_DOMAIN_MODULES],
    ["@nestjs/", "drizzle-orm", "express", "@repo/database-runtime"],
  );
});

test("isForbiddenDomainSpecifier matches packages and their subpaths", () => {
  for (const specifier of [
    "@nestjs/common",
    "@nestjs/core",
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "express",
    "@repo/database-runtime",
    "@repo/database-runtime/schema",
  ]) {
    assert.equal(isForbiddenDomainSpecifier(specifier), true, `${specifier} must be forbidden`);
  }
  for (const specifier of ["@repo/api-kernel", "@repo/api-runtime", "./relative", "node:crypto"]) {
    assert.equal(isForbiddenDomainSpecifier(specifier), false, `${specifier} must be allowed`);
  }
});

test("a value import is a violation and reports its position", () => {
  const violations = violationsOf(`import { Injectable } from "@nestjs/common";\n`);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].specifier, "@nestjs/common");
  assert.equal(violations[0].line, 1);
  assert.equal(violations[0].kind, "value import");
});

test("type-only imports are allowed in every accepted spelling", () => {
  assert.deepEqual(
    violationsOf(
      [
        `import type { NestMiddleware } from "@nestjs/common";`,
        `import { type SQL, type Table } from "drizzle-orm";`,
        `import type { Request } from "express";`,
        `import type { Database } from "@repo/database-runtime";`,
        `import type express from "express";`,
      ].join("\n"),
    ),
    [],
  );
});

test("a mixed named import is a violation because one binding is a value", () => {
  const violations = violationsOf(
    `import { Injectable, type NestMiddleware } from "@nestjs/common";\n` +
      `import { sql, type SQL } from "drizzle-orm";\n`,
  );
  assert.deepEqual(
    violations.map((violation) => violation.specifier),
    ["@nestjs/common", "drizzle-orm"],
  );
});

test("default, namespace and side-effect imports are violations", () => {
  const violations = violationsOf(
    [
      `import express from "express";`,
      `import * as drizzle from "drizzle-orm";`,
      `import "@nestjs/common";`,
      `import runtime = require("@repo/database-runtime");`,
      `const pool = require("express");`,
      `const lazy = await import("drizzle-orm");`,
    ].join("\n"),
  );
  assert.deepEqual(
    violations.map((violation) => violation.kind),
    [
      "value import",
      "value import",
      "value import",
      "require import",
      "dynamic import",
      "dynamic import",
    ],
  );
});

test("value re-exports are violations and type re-exports are not", () => {
  const violations = violationsOf(
    [
      `export { Injectable } from "@nestjs/common";`,
      `export * from "drizzle-orm";`,
      `export type { SQL } from "drizzle-orm";`,
      `export type * from "@nestjs/common";`,
    ].join("\n"),
  );
  assert.deepEqual(
    violations.map((violation) => violation.kind),
    ["value re-export", "value re-export"],
  );
});

test("the specifier must come from an import, not from a string literal or a comment", () => {
  assert.deepEqual(
    violationsOf(
      [
        `// import { Injectable } from "@nestjs/common";`,
        `export const FORBIDDEN = "@nestjs/common";`,
        `export const message = 'no import { X } from "express" here';`,
      ].join("\n"),
    ),
    [],
  );
});

test("the CLI fails on a probe package and passes once the probe is removed", () => {
  const probeRoot = mkdtempSync(join(tmpdir(), "domain-purity-"));
  const domainDirectory = join(probeRoot, "packages", "feature-probe", "src", "domain");
  mkdirSync(domainDirectory, { recursive: true });
  writeFileSync(
    join(probeRoot, "packages", "feature-probe", "package.json"),
    JSON.stringify({ name: "@repo/feature-probe", exports: { ".": "./src/index.ts" } }),
  );
  const probeFile = join(domainDirectory, "probe.policy.ts");
  writeFileSync(probeFile, `import { Injectable } from "@nestjs/common";\nexport class Probe {}\n`);

  try {
    const failing = spawnSync(process.execPath, [guard], { cwd: probeRoot, encoding: "utf8" });
    assert.equal(failing.status, 1);
    assert.match(
      failing.stderr,
      /Domain purity guard failed: packages\/feature-probe\/src\/domain\/probe\.policy\.ts:1:1/,
    );
    assert.match(failing.stderr, /@nestjs\/common/);

    rmSync(probeFile);
    const passing = spawnSync(process.execPath, [guard], { cwd: probeRoot, encoding: "utf8" });
    assert.equal(passing.status, 0);
    assert.match(passing.stdout, /Domain purity guard passed\./);
  } finally {
    rmSync(probeRoot, { recursive: true, force: true });
  }
});

test("specs inside domain/ stay out of scope", () => {
  const probeRoot = mkdtempSync(join(tmpdir(), "domain-purity-"));
  const testsDirectory = join(probeRoot, "packages", "feature-probe", "src", "domain", "__tests__");
  mkdirSync(testsDirectory, { recursive: true });
  writeFileSync(
    join(probeRoot, "packages", "feature-probe", "package.json"),
    JSON.stringify({ name: "@repo/feature-probe", exports: { ".": "./src/index.ts" } }),
  );
  writeFileSync(
    join(testsDirectory, "probe.policy.spec.ts"),
    `import { Injectable } from "@nestjs/common";\n`,
  );

  try {
    const result = spawnSync(process.execPath, [guard], { cwd: probeRoot, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  } finally {
    rmSync(probeRoot, { recursive: true, force: true });
  }
});

test("the repository itself passes the guard", () => {
  const result = spawnSync(process.execPath, [guard], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Domain purity guard passed\./);
});
