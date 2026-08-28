#!/usr/bin/env node
/**
 * Real committed-migration drift check.
 *
 * Strategy:
 *
 *   1. Copy the committed migrations directory into a temporary directory and
 *      run drizzle-kit generate against the canonical feature schemas. If
 *      drizzle-kit emits any new migration artifacts, drift is real.
 *
 *   2. As defense in depth, flag destructive operations (DROP TABLE, DROP
 *      COLUMN, DROP CONSTRAINT) in any generated migration for manual review.
 *
 *   3. The working tree is never mutated: all work happens in a temporary
 *      directory that is deleted in `finally`.
 */
import { spawn } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const committedMigrationsDir = resolve(root, "apps/api/migrations");
const temp = await mkdtemp(join(tmpdir(), "schema-drift-"));
const tempMigrations = join(temp, "migrations");
const config = join(temp, "drizzle.config.ts");

let failed = false;
const reasons = [];

try {
  const committed = new Set(
    (await readdir(committedMigrationsDir))
      .filter((f) => f.endsWith(".sql") || f.endsWith(".json"))
      .map((f) => f),
  );

  await rm(tempMigrations, { recursive: true, force: true });
  await mkdir(tempMigrations, { recursive: true });

  const persistence = resolve(root, "packages");
  const schema = join(persistence, "feature-*/src/infrastructure/persistence/**/*.ts");

  const databaseUrl =
    process.env.DATABASE_MIGRATE_URL ??
    `postgresql://${process.env.POSTGRES_USER ?? "postgres"}:${process.env.POSTGRES_PASSWORD ?? "postgres"}@${process.env.POSTGRES_HOST ?? "localhost"}:${process.env.POSTGRES_PORT ?? "5432"}/${process.env.POSTGRES_DB ?? "fullstack_starter"}`;
  console.error("[debug] databaseUrl:", databaseUrl);
  console.error("[debug] schema:", schema);
  console.error("[debug] out:", tempMigrations);
  await writeFile(
    config,
    `import { defineConfig } from "drizzle-kit";\nexport default defineConfig({ schema: ${JSON.stringify(schema)}, out: ${JSON.stringify(tempMigrations)}, dialect: "postgresql", dbCredentials: { url: ${JSON.stringify(databaseUrl)} }, strict: true });\n`,
  );
  console.error("[debug] config written");

  const code = await new Promise((resolveCode) => {
    const child = spawn(
      "pnpm",
      ["--filter", "@repo/database-runtime", "exec", "drizzle-kit", "generate", "--config", config],
      {
        cwd: root,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stderr = "";
    child.stdout?.pipe(process.stdout);
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
      process.stderr.write(chunk);
    });
    child.on("close", (value) =>
      resolveCode(/(?:Transform failed|Error\b|ERR_)/.test(stderr) ? 1 : (value ?? 1)),
    );
  });

  if (code !== 0) {
    reasons.push(`drizzle-kit generate failed with exit code ${code}.`);
    failed = true;
  } else {
    const produced = (await readdir(tempMigrations))
      .filter((f) => f.endsWith(".sql") || f.endsWith(".json"));
    const newFiles = produced.filter((f) => !committed.has(f));
    if (newFiles.length > 0) {
      failed = true;
      reasons.push(
        `Migration drift detected. The current canonical schemas would generate new migration artifacts: ${newFiles.join(", ")}. Commit a new migration or revert the schema change.`,
      );
      for (const f of newFiles) {
        const path = join(tempMigrations, f);
        try {
          const sql = await readFile(path, "utf8");
          const destructive = /DROP\s+TABLE|DROP\s+COLUMN|DROP\s+CONSTRAINT|ALTER\s+COLUMN[^;]*DROP\s+NOT\s+NULL/i;
          if (destructive.test(sql)) {
            reasons.push(
              `Destructive operation in generated migration "${f}". Manual review required.`,
            );
          }
          const preview = sql.split("\n").slice(0, 20).join("\n");
          reasons.push(`---- preview of ${f} ----\n${preview}\n----`);
        } catch (err) {
          reasons.push(`(failed to read ${path}: ${err})`);
        }
      }
    }
  }
} finally {
  console.error("[debug] temp dir:", temp);
  await new Promise(r => setTimeout(r, 5000));
  await rm(temp, { recursive: true, force: true });
}

if (failed) {
  console.error("Schema drift check failed:");
  for (const r of reasons) {
    console.error(`- ${r}`);
  }
  process.exit(1);
}
console.log("Schema drift check passed: current schemas match committed migration history.");
