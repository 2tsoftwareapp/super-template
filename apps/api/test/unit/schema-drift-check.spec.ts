import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const findRepoRoot = (start: string): string => {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, "scripts/check-schema.mjs"))) return current;
    const parent = resolve(current, "..");
    if (parent === current) throw new Error("Unable to locate repository root");
    current = parent;
  }
};

const repoRoot = findRepoRoot(process.cwd());
const migrationsDir = resolve(repoRoot, "apps/api/migrations");
const packagesDir = resolve(repoRoot, "packages");

/**
 * Create a fully isolated copy of both migrations AND schema sources.
 * The tracked source files are NEVER written to by these tests — everything
 * happens inside a disposable temp directory.
 */
function createIsolatedEnvironment(): {
  tempMigrations: string;
  tempPackages: string;
  cleanup: () => void;
} {
  const id = `schema-drift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = join(tmpdir(), id);
  const tempMigrations = join(base, "migrations");
  const tempPackages = join(base, "packages");

  mkdirSync(tempMigrations, { recursive: true });
  cpSync(migrationsDir, tempMigrations, { recursive: true });

  // Copy the schema source tree so mutations happen on temp copies.
  mkdirSync(tempPackages, { recursive: true });
  for (const dir of readdirSync(packagesDir)) {
    if (!dir.startsWith("feature-") && dir !== "feature-outbox") continue;
    cpSync(join(packagesDir, dir), join(tempPackages, dir), { recursive: true });
  }

  return {
    tempMigrations,
    tempPackages,
    cleanup: () => rmSync(base, { recursive: true, force: true }),
  };
}

/** Path to the organization-members schema inside a temp packages copy. */
function tempSchemaFile(tempPackages: string): string {
  return join(
    tempPackages,
    "feature-organizations/src/infrastructure/persistence/organization-members.ts",
  );
}

/**
 * Run check-schema.mjs against optional custom paths.
 */
function runDriftCheck(opts?: { migrationsPath?: string; schemaRoot?: string }): {
  code: number;
  stderr: string;
  stdout: string;
} {
  const args = [resolve(repoRoot, "scripts/check-schema.mjs")];
  if (opts?.migrationsPath) args.push("--migrations", opts.migrationsPath);
  if (opts?.schemaRoot) args.push("--schema-root", opts.schemaRoot);
  try {
    execFileSync("node", args, { cwd: repoRoot, stdio: "pipe" });
    return { code: 0, stderr: "", stdout: "" };
  } catch (err) {
    const e = err as { status?: number | null; stderr?: Buffer | string; stdout?: Buffer | string };
    return {
      code: e.status ?? 1,
      stderr: e.stderr ? String(e.stderr) : "",
      stdout: e.stdout ? String(e.stdout) : "",
    };
  }
}

/** Bootstrap integrity manifest in a temp copy, then verify it passes. */
function bootstrapManifest(tempMigrations: string): void {
  // Generate manifest for the temp copy.
  execFileSync(
    "node",
    [resolve(repoRoot, "scripts/check-schema.mjs"), "--generate", "--migrations", tempMigrations],
    { cwd: repoRoot, stdio: "pipe" },
  );
  // Verify it passes.
  const result = runDriftCheck({ migrationsPath: tempMigrations });
  expect(result.code, result.stderr).toBe(0);
}

describe("Schema drift check", () => {
  it("passes when canonical schemas match committed migrations", () => {
    const result = runDriftCheck();
    expect(result.code, result.stderr).toBe(0);
  });

  describe("SQL migration integrity (append-only enforcement)", () => {
    it("fails when an old SQL migration file is modified", () => {
      const { tempMigrations, cleanup } = createIsolatedEnvironment();
      try {
        bootstrapManifest(tempMigrations);

        const sqls = readdirSync(tempMigrations)
          .filter((f) => f.endsWith(".sql"))
          .sort();
        expect(sqls.length).toBeGreaterThan(0);

        // Mutate the oldest SQL file — this MUST fail.
        const targetSql = join(tempMigrations, sqls[0]!);
        const original = readFileSync(targetSql, "utf8");
        writeFileSync(targetSql, original + "\n-- test mutation\n");

        const result = runDriftCheck({ migrationsPath: tempMigrations });
        expect(result.code, result.stderr).toBe(1);
        expect(result.stderr).toMatch(/modified/i);
      } finally {
        cleanup();
      }
    });

    it("fails when an old SQL migration file is deleted", () => {
      const { tempMigrations, cleanup } = createIsolatedEnvironment();
      try {
        bootstrapManifest(tempMigrations);

        const sqls = readdirSync(tempMigrations)
          .filter((f) => f.endsWith(".sql"))
          .sort();
        expect(sqls.length).toBeGreaterThan(0);

        const targetSql = join(tempMigrations, sqls[0]!);
        rmSync(targetSql);

        const result = runDriftCheck({ migrationsPath: tempMigrations });
        expect(result.code, result.stderr).toBe(1);
        expect(result.stderr).toMatch(/deleted|missing/i);
      } finally {
        cleanup();
      }
    });

    it("allows appending new SQL files (append-only)", () => {
      const { tempMigrations, cleanup } = createIsolatedEnvironment();
      try {
        bootstrapManifest(tempMigrations);

        const newFile = join(tempMigrations, "9999_append_only_test.sql");
        writeFileSync(newFile, "CREATE TABLE test_append_only (id uuid PRIMARY KEY);\n");

        // New files are fine — only existing-file modification must fail.
        const result = runDriftCheck({ migrationsPath: tempMigrations });
        // Schema drift may fail (new table not in canonical schema), but
        // integrity must not be the cause.
        if (result.code !== 0) {
          expect(result.stderr).not.toMatch(/modified|deleted/i);
        }
      } finally {
        cleanup();
      }
    });
  });

  describe("schema source mutations (tracked files never touched)", () => {
    it("detects when a pgTable column loses its FK references()", () => {
      const { tempMigrations, tempPackages, cleanup } = createIsolatedEnvironment();
      try {
        const target = tempSchemaFile(tempPackages);
        const original = readFileSync(target, "utf8");
        const mutated = original.replace(
          /userId: uuid\("user_id"\)\n\s*\.notNull\(\)\n\s*\.references\(\(\) => users\.id, \{ onDelete: "cascade" \}\),/,
          'userId: uuid("user_id").notNull(),',
        );
        expect(mutated).not.toBe(original);
        writeFileSync(target, mutated);

        const result = runDriftCheck({
          migrationsPath: tempMigrations,
          schemaRoot: tempPackages,
        });
        expect(result.code, result.stderr).toBe(1);
        expect(result.stderr).toMatch(/drift|destructive/i);
      } finally {
        cleanup();
      }
    });

    it("detects when onDelete: cascade is changed to set null", () => {
      const { tempMigrations, tempPackages, cleanup } = createIsolatedEnvironment();
      try {
        const target = tempSchemaFile(tempPackages);
        const original = readFileSync(target, "utf8");
        const mutated = original.replace(/onDelete: "cascade"/, 'onDelete: "set null"');
        expect(mutated).not.toBe(original);
        writeFileSync(target, mutated);

        const result = runDriftCheck({
          migrationsPath: tempMigrations,
          schemaRoot: tempPackages,
        });
        expect(result.code, result.stderr).toBe(1);
      } finally {
        cleanup();
      }
    });

    it("detects when a column drops its NOT NULL constraint", () => {
      const { tempMigrations, tempPackages, cleanup } = createIsolatedEnvironment();
      try {
        const target = tempSchemaFile(tempPackages);
        const original = readFileSync(target, "utf8");
        const mutated = original.replace(
          /userId: uuid\("user_id"\)\n\s*\.notNull\(\)\n\s*\.references/,
          'userId: uuid("user_id")\n      .references',
        );
        expect(mutated).not.toBe(original);
        writeFileSync(target, mutated);

        const result = runDriftCheck({
          migrationsPath: tempMigrations,
          schemaRoot: tempPackages,
        });
        expect(result.code, result.stderr).toBe(1);
      } finally {
        cleanup();
      }
    });

    it("detects when a column is removed entirely", () => {
      const { tempMigrations, tempPackages, cleanup } = createIsolatedEnvironment();
      try {
        const target = tempSchemaFile(tempPackages);
        const original = readFileSync(target, "utf8");
        const mutated = original.replace(
          /    userId: uuid\("user_id"\)\n\s*\.notNull\(\)\n\s*\.references\(\(\) => users\.id, \{ onDelete: "cascade" \}\),\n/,
          "",
        );
        expect(mutated).not.toBe(original);
        writeFileSync(target, mutated);

        const result = runDriftCheck({
          migrationsPath: tempMigrations,
          schemaRoot: tempPackages,
        });
        expect(result.code, result.stderr).toBe(1);
      } finally {
        cleanup();
      }
    });
  });
});
