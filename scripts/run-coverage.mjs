#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const aggregatePath = resolve(root, "coverage/aggregate-summary.json");

// This is the declared baseline for the workspaces that currently publish
// machine-readable Vitest coverage. It is intentionally separate from each
// package's local threshold so the root check governs the combined result.
const thresholds = {
  statements: 60,
  branches: 50,
  functions: 45,
  lines: 60,
};

const effectiveThresholds = Object.fromEntries(
  Object.entries(thresholds).map(([key, value]) => [
    key,
    Number(process.env[`COVERAGE_MIN_${key.toUpperCase()}`] ?? value),
  ]),
);

for (const [key, value] of Object.entries(effectiveThresholds)) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`COVERAGE_MIN_${key.toUpperCase()} must be a number between 0 and 100`);
  }
}

const workspaces = [
  { name: "api", filter: "api", script: "test:coverage" },
  { name: "config", filter: "@repo/config", script: "test:coverage" },
  { name: "utils", filter: "@repo/utils", script: "test:coverage" },
  {
    name: "feature-upload",
    filter: "@repo/feature-upload",
    script: "test:coverage",
  },
];

const run = (args) => {
  const result = spawnSync("pnpm", args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const metric = (summary, key) => {
  const value = summary?.total?.[key];
  if (!value || typeof value.total !== "number" || typeof value.covered !== "number") {
    throw new Error(`Coverage summary is missing a numeric ${key} total`);
  }
  return { total: value.total, covered: value.covered };
};

const aggregate = Object.fromEntries(
  Object.keys(thresholds).map((key) => [key, { total: 0, covered: 0 }]),
);

for (const workspace of workspaces) {
  run(["--filter", workspace.filter, workspace.script]);

  const summaryPath = resolve(
    root,
    workspace.name === "api" ? "apps/api" : `packages/${workspace.name}`,
    "coverage/coverage-summary.json",
  );
  const summary = JSON.parse(await readFile(summaryPath, "utf8"));

  for (const key of Object.keys(thresholds)) {
    const current = metric(summary, key);
    aggregate[key].total += current.total;
    aggregate[key].covered += current.covered;
  }
}

const result = Object.fromEntries(
  Object.entries(aggregate).map(([key, value]) => [
    key,
    {
      ...value,
      pct: value.total === 0 ? 100 : Number(((value.covered / value.total) * 100).toFixed(2)),
      threshold: effectiveThresholds[key],
    },
  ]),
);

await mkdir(dirname(aggregatePath), { recursive: true });
await writeFile(
  aggregatePath,
  JSON.stringify(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      workspaces: workspaces.map(({ name }) => name),
      thresholds: effectiveThresholds,
      total: result,
    },
    null,
    2,
  ) + "\n",
);

console.log("\nAggregate coverage");
for (const [key, value] of Object.entries(result)) {
  const status = value.pct >= value.threshold ? "PASS" : "FAIL";
  console.log(
    `${key.padEnd(10)} ${value.pct.toFixed(2).padStart(6)}% (threshold ${value.threshold}%) ${status}`,
  );
}
console.log(`Summary: ${aggregatePath}`);

const failed = Object.entries(result).filter(([, value]) => value.pct < value.threshold);
if (failed.length > 0) {
  console.error(`Coverage baseline failed for: ${failed.map(([key]) => key).join(", ")}`);
  process.exit(1);
}
