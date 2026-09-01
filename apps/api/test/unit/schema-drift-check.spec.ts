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
 *
 * Returns:
 *  - base: temp root (equivalent of repo root for --packages-dir / --migrations)
 *  - tempMigrations: absolute path to copied migrations dir
 *  - cleanup: remove the temp tree
 */
function createIsolatedEnvironment(): {
  base: string;
  tempMigrations: string;
  tempPackages: string;
  cleanup: () => void;
} {
  const id = `schema-drift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = join(tmpdir(), id);
  const tempMigrations = join(base, "apps/api/migrations");
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
    base,
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
 * --migrations points to the temp migrations dir.
 * --packages-dir points to the temp packages dir (NOT the base).
 */
function runDriftCheck(opts?: { migrationsPath?: string; packagesDir?: string }): {
  code: number;
  stderr: string;
  stdout: string;
} {
  const args = [resolve(repoRoot, "scripts/check-schema.mjs")];
  if (opts?.migrationsPath) args.push("--migrations", opts.migrationsPath);
  if (opts?.packagesDir) args.push("--packages-dir", opts.packagesDir);
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

/**
 * Generate a fresh integrity manifest for the temp migrations dir.
 * This creates a baseline so we can then test tamper detection.
 */
function bootstrapManifest(tempMigrations: string): void {
  execFileSync(
    "node",
    [resolve(repoRoot, "scripts/check-schema.mjs"), "--generate", "--migrations", tempMigrations],
    { cwd: repoRoot, stdio: "pipe" },
  );
}

describe("Schema drift check", () => {
  it("passes when canonical schemas match committed migrations", { timeout: 30_000 }, () => {
    const result = runDriftCheck();
    expect(result.code, result.stderr).toBe(0);
  });

  describe("SQL migration integrity (append-only enforcement)", () => {
    it("fails when an old SQL migration file is modified", { timeout: 30_000 }, () => {
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

    it("fails when an old SQL migration file is deleted", { timeout: 30_000 }, () => {
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

    it(
      "fails in default mode when new SQL files exist but are not sealed",
      { timeout: 30_000 },
      () => {
        const { tempMigrations, cleanup } = createIsolatedEnvironment();
        try {
          bootstrapManifest(tempMigrations);

          // Add a new SQL file without regenerating the manifest.
          const newFile = join(tempMigrations, "9999_unsealable.sql");
          writeFileSync(newFile, "CREATE TABLE test_unsealable (id uuid PRIMARY KEY);\n");

          const result = runDriftCheck({ migrationsPath: tempMigrations });
          expect(result.code, result.stderr).toBe(1);
          expect(result.stderr).toMatch(/not in integrity manifest|not yet.*sealed/i);
        } finally {
          cleanup();
        }
      },
    );

    it("allows sealing new SQL files via --generate (append-only)", { timeout: 30_000 }, () => {
      const { tempMigrations, cleanup } = createIsolatedEnvironment();
      try {
        bootstrapManifest(tempMigrations);

        // Add a new SQL file and seal it.
        const newFile = join(tempMigrations, "9999_sealed.sql");
        writeFileSync(newFile, "CREATE TABLE test_sealed (id uuid PRIMARY KEY);\n");

        // Seal the new file.
        execFileSync(
          "node",
          [
            resolve(repoRoot, "scripts/check-schema.mjs"),
            "--generate",
            "--migrations",
            tempMigrations,
          ],
          { cwd: repoRoot, stdio: "pipe" },
        );

        // Now the sealed manifest should pass integrity check.
        const result = runDriftCheck({ migrationsPath: tempMigrations });
        // May still fail for schema drift (new table not in canonical schema),
        // but must NOT fail for integrity reasons.
        if (result.code !== 0) {
          expect(result.stderr).not.toMatch(/modified|deleted|not in integrity/i);
        }
      } finally {
        cleanup();
      }
    });

    it(
      "--generate fails when trying to overwrite modified existing checksums",
      { timeout: 30_000 },
      () => {
        const { tempMigrations, cleanup } = createIsolatedEnvironment();
        try {
          bootstrapManifest(tempMigrations);

          // Read the manifest before tampering so we can verify it was not changed.
          const manifestPath = join(tempMigrations, "meta", "migration-integrity.json");
          const manifestBefore = readFileSync(manifestPath, "utf8");

          const sqls = readdirSync(tempMigrations)
            .filter((f) => f.endsWith(".sql"))
            .sort();
          expect(sqls.length).toBeGreaterThan(0);

          // Mutate the oldest SQL file.
          const targetSql = join(tempMigrations, sqls[0]!);
          const original = readFileSync(targetSql, "utf8");
          writeFileSync(targetSql, original + "\n-- tampered\n");

          // --generate must refuse to overwrite — call it directly with execFileSync.
          let generateError: { status?: number | null; stderr?: Buffer | string } | null = null;
          try {
            execFileSync(
              "node",
              [
                resolve(repoRoot, "scripts/check-schema.mjs"),
                "--generate",
                "--migrations",
                tempMigrations,
              ],
              { cwd: repoRoot, stdio: "pipe" },
            );
          } catch (err) {
            generateError = err as { status?: number | null; stderr?: Buffer | string };
          }

          // --generate must exit with code 1.
          expect(generateError).not.toBeNull();
          expect(generateError!.status, "--generate should fail with exit code 1").toBe(1);

          const stderr = generateError!.stderr ? String(generateError!.stderr) : "";
          expect(stderr).toMatch(/modified|cannot overwrite|append-only/i);

          // The manifest must NOT have been overwritten — checksums must be unchanged.
          const manifestAfter = readFileSync(manifestPath, "utf8");
          expect(manifestAfter).toBe(manifestBefore);
        } finally {
          cleanup();
        }
      },
    );
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
          packagesDir: tempPackages,
        });
        expect(result.code, result.stderr).toBe(1);
        // Must be an actual schema error, not ENOENT or module resolution error.
        expect(result.stderr).not.toMatch(/ENOENT|MODULE_NOT_FOUND|Cannot find module/i);
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
          packagesDir: tempPackages,
        });
        expect(result.code, result.stderr).toBe(1);
        expect(result.stderr).not.toMatch(/ENOENT|MODULE_NOT_FOUND|Cannot find module/i);
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
          packagesDir: tempPackages,
        });
        expect(result.code, result.stderr).toBe(1);
        expect(result.stderr).not.toMatch(/ENOENT|MODULE_NOT_FOUND|Cannot find module/i);
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
          packagesDir: tempPackages,
        });
        expect(result.code, result.stderr).toBe(1);
        expect(result.stderr).not.toMatch(/ENOENT|MODULE_NOT_FOUND|Cannot find module/i);
      } finally {
        cleanup();
      }
    });
  });
});
