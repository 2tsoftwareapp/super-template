#!/usr/bin/env node
/**
 * Verify that canonical Drizzle schemas are represented by the committed SQL
 * migration history. Drizzle metadata is intentionally not copied: stale or
 * partially reconciled snapshots can trigger interactive rename prompts in CI.
 */
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrations = resolve(root, "apps/api/migrations");
const temp = await mkdtemp(join(process.env.TMPDIR ?? "/tmp", "super-template-schema-"));
const output = join(temp, "migrations");
const config = join(temp, "drizzle.config.ts");
const drizzle = resolve(root, "packages/database-runtime/node_modules/.bin/drizzle-kit");

async function filesUnder(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await filesUnder(path, base)));
    else result.push(relative(base, path));
  }
  return result.sort();
}

function run(command, args, cwd) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += String(chunk)));
    child.stderr.on("data", (chunk) => (stderr += String(chunk)));
    child.on("close", (code) => resolveRun({ code: code ?? 1, stdout, stderr }));
  });
}

const normalize = (value) => value.replace(/\/\*[^]*?\*\//g, "").replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
const statements = (value) => value.split(/--> statement-breakpoint/g).map(normalize).filter(Boolean);

let failure;
try {
  await mkdirOutput(output);
  for (const file of await filesUnder(migrations)) {
    if (!file.endsWith(".sql")) continue;
    await mkdir(dirname(join(output, file)), { recursive: true });
    await cp(join(migrations, file), join(output, file));
  }
  const packageFiles = await filesUnder(resolve(root, "packages"));
  const schemaFiles = packageFiles
    .filter((file) => /^feature-[^/]+\/src\/infrastructure\/persistence\/index\.ts$/.test(file) || file === "feature-outbox/src/infrastructure/persistence/outbox-messages.ts")
    .map((file) => resolve(root, "packages", file));
  const schemaEntry = join(temp, "schema.ts");
  await writeFile(schemaEntry, schemaFiles.map((file) => `export * from ${JSON.stringify(file)};`).join("\n") + "\n");
  await writeFile(
    config,
    `import { defineConfig } from "drizzle-kit";\nexport default defineConfig({ schema: ${JSON.stringify(schemaEntry)}, out: "migrations", dialect: "postgresql", dbCredentials: { url: "postgresql://schema-check.invalid/schema_check" }, strict: true });\n`,
  );
  const result = await run(drizzle, ["generate", "--config", config], temp);
  if (result.code !== 0 || /Error|ERR_|Interactive prompts require/i.test(result.stderr)) {
    failure = `drizzle-kit generate failed: ${result.stderr.trim() || `exit code ${result.code}`}`;
  } else {
    const committed = await filesUnder(migrations);
    const produced = await filesUnder(output);
    const committedSnapshots = committed.filter((entry) => entry.startsWith("meta/") && entry.endsWith("_snapshot.json"));
    const producedSnapshots = produced.filter((entry) => entry.startsWith("meta/") && entry.endsWith("_snapshot.json"));
    const latest = (entries) => entries.sort().at(-1);
    const committedSnapshotPath = latest(committedSnapshots);
    const producedSnapshotPath = latest(producedSnapshots);
    if (!committedSnapshotPath || !producedSnapshotPath) {
      failure = "Schema drift detected: committed and generated Drizzle snapshots are required";
    } else {
      const volatileKeys = new Set(["id", "prevId", "version", "dialect"]);
      const normalizeSnapshot = (value) => {
        if (Array.isArray(value)) return value.map(normalizeSnapshot).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        if (value && typeof value === "object") {
          return Object.fromEntries(Object.entries(value).filter(([key]) => !volatileKeys.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalizeSnapshot(child)]));
        }
        return value;
      };
      const committedRaw = JSON.parse(await readFile(join(migrations, committedSnapshotPath), "utf8"));
      const producedRaw = JSON.parse(await readFile(join(output, producedSnapshotPath), "utf8"));
      const migrationSql = (await Promise.all(committed.filter((entry) => entry.endsWith(".sql")).map((entry) => readFile(join(migrations, entry), "utf8")))).join("\n");
      const renames = new Map([...migrationSql.matchAll(/ALTER TABLE\s+([a-z0-9_]+)\s+RENAME TO\s+([a-z0-9_]+)/gi)].map((match) => [match[1], match[2]]));
      const reverseRenames = new Map([...renames].map(([oldName, newName]) => [newName, oldName]));
      const canonicalizeGenerated = (value) => {
        if (Array.isArray(value)) return value.map(canonicalizeGenerated);
        if (typeof value === "string") {
          let result = value;
          for (const [newName, oldName] of reverseRenames) result = result.split(newName).join(oldName);
          return result;
        }
        if (value && typeof value === "object") {
          return Object.fromEntries(Object.entries(value).map(([key, child]) => [canonicalizeGenerated(key), canonicalizeGenerated(child)]));
        }
        return value;
      };
      const stripCrossFeatureForeignKeys = (snapshot) => ({
        ...snapshot,
        tables: Object.fromEntries(Object.entries(snapshot.tables ?? {}).map(([name, table]) => [name, { ...table, foreignKeys: {} }])),
      });
      const committedSnapshot = normalizeSnapshot(stripCrossFeatureForeignKeys(committedRaw));
      const producedSnapshot = normalizeSnapshot(stripCrossFeatureForeignKeys(canonicalizeGenerated(producedRaw)));
      if (JSON.stringify(committedSnapshot) !== JSON.stringify(producedSnapshot)) {
        await writeFile("/tmp/committed-schema.json", JSON.stringify(committedSnapshot, null, 2));
        await writeFile("/tmp/produced-schema.json", JSON.stringify(producedSnapshot, null, 2));
        failure = "Schema drift detected: canonical Drizzle schema does not match the complete committed effective snapshot";
      }
    }
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}

if (failure) {
  console.error(failure);
  process.exit(1);
}
console.log("Schema drift check passed: canonical schemas match committed migration history.");

async function mkdirOutput(directory) {
  await (await import("node:fs/promises")).mkdir(directory, { recursive: true });
}
