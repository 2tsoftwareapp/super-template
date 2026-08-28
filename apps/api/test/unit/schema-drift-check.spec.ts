import { describe, expect, it } from "vitest";

import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const repoRoot = resolve(process.cwd(), "..", "..");
const committedMigrationsDir = resolve(repoRoot, "apps/api/migrations");

const runDriftCheck = () => {
  try {
    execFileSync("node", [resolve(repoRoot, "scripts/check-schema.mjs")], {
      cwd: repoRoot,
      stdio: "pipe",
    });
    return { code: 0, stderr: "", stdout: "" };
  } catch (err) {
    const e = err as { status?: number | null; stderr?: Buffer | string; stdout?: Buffer | string };
    return {
      code: e.status ?? 1,
      stderr: e.stderr ? String(e.stderr) : "",
      stdout: e.stdout ? String(e.stdout) : "",
    };
  }
};

describe("Schema drift check (committed migration comparison)", () => {
  it("passes when the canonical schemas match the committed migrations", () => {
    const result = runDriftCheck();
    expect(result.code, result.stderr).toBe(0);
  });

  it("fails when a pgTable column loses its FK references()", async () => {
    // Pick a stable, non-changing file to mutate, then restore it.
    const target = resolve(
      repoRoot,
      "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
    );
    const original = await readFile(target, "utf8");
    // Drop the .references() chain on the userId column.
    const mutated = original.replace(
      /\n    userId: uuid\("user_id"\)\s*\n\s*\.notNull\(\)\s*\n\s*\.references\(\(\) => users\.id, \{ onDelete: "cascade" \}\),/m,
      '\n    userId: uuid("user_id").notNull(),',
    );
    expect(mutated).not.toBe(original);
    await writeFile(target, mutated);
    try {
      const result = runDriftCheck();
      expect(result.code, result.stderr).toBe(1);
      expect(result.stderr).toMatch(/drift|destructive/i);
    } finally {
      await writeFile(target, original);
    }
  });

  it("fails when a column with onDelete: cascade changes to set null", async () => {
    const target = resolve(
      repoRoot,
      "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
    );
    const original = await readFile(target, "utf8");
    const mutated = original.replace(
      /userId: uuid\("user_id"\)\s*\n\s*\.notNull\(\)\s*\n\s*\.references\(\(\) => users\.id, \{ onDelete: "cascade" \}\),/m,
      'userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "set null" }),',
    );
    expect(mutated).not.toBe(original);
    await writeFile(target, mutated);
    try {
      const result = runDriftCheck();
      expect(result.code, result.stderr).toBe(1);
    } finally {
      await writeFile(target, original);
    }
  });

  it("fails when a column drops its NOT NULL constraint", async () => {
    const target = resolve(
      repoRoot,
      "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
    );
    const original = await readFile(target, "utf8");
    const mutated = original.replace(
      'userId: uuid("user_id")\n    .notNull()\n    .references',
      'userId: uuid("user_id")\n    .references',
    );
    expect(mutated).not.toBe(original);
    await writeFile(target, mutated);
    try {
      const result = runDriftCheck();
      expect(result.code, result.stderr).toBe(1);
    } finally {
      await writeFile(target, original);
    }
  });

  it("fails when a column is removed entirely", async () => {
    const target = resolve(
      repoRoot,
      "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
    );
    const original = await readFile(target, "utf8");
    // Remove the entire userId column declaration.
    const mutated = original.replace(
      /\n    userId: uuid\("user_id"\)\s*\n\s*\.notNull\(\)\s*\n\s*\.references\(\(\) => users\.id, \{ onDelete: "cascade" \}\),/m,
      "",
    );
    expect(mutated).not.toBe(original);
    await writeFile(target, mutated);
    try {
      const result = runDriftCheck();
      expect(result.code, result.stderr).toBe(1);
    } finally {
      await writeFile(target, original);
    }
  });
});
