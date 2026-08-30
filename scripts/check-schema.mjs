#!/usr/bin/env node
/**
 * Verify that canonical Drizzle schemas are represented by the committed SQL
 * migration history, and that the SQL migration history is append-only.
 *
 * Two integrity checks:
 * 1. Canonical TypeScript schema matches the committed Drizzle snapshot.
 * 2. All previously committed SQL migration files are unmodified (SHA-256 checksums).
 *
 * Usage:
 *   node check-schema.mjs                          # normal check (read-only)
 *   node check-schema.mjs --migrations <dir>       # check against a custom migrations dir
 *   node check-schema.mjs --schema-root <dir>      # read schema files from <dir>
 *   node check-schema.mjs --generate               # (re)generate the integrity manifest
 *   node check-schema.mjs --generate --migrations <dir> # generate for a custom dir
 */
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// --- CLI flags ---
const argv = process.argv.slice(2);

function flagValue(name) {
  const idx = argv.indexOf(name);
  return idx !== -1 && idx + 1 < argv.length ? resolve(argv[idx + 1]) : null;
}

const generateMode = argv.includes("--generate");
const migrations = flagValue("--migrations") ?? resolve(root, "apps/api/migrations");
const schemaRoot = flagValue("--schema-root") ?? root;

// --- Helpers ---

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

function sha256hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

const normalize = (value) =>
  value.replace(/\/\*[^]*?\*\//g, "").replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();

let failures = [];

// --- 1. Migration integrity: SHA-256 checksums ---
const INTEGRITY_MANIFEST = "migration-integrity.json";

try {
  const manifestPath = join(migrations, "meta", INTEGRITY_MANIFEST);

  // Compute current checksums for all SQL files.
  const sqlFiles = (await readdir(migrations))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const currentChecksums = {};
  for (const file of sqlFiles) {
    const content = await readFile(join(migrations, file), "utf8");
    currentChecksums[file] = sha256hex(content);
  }

  if (generateMode) {
    // Write/update the manifest. Called when migrations change intentionally.
    const manifest = { version: 1, files: currentChecksums };
    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(
      `Integrity manifest written: ${manifestPath} (${Object.keys(currentChecksums).length} files)`,
    );
  } else if (existsSync(manifestPath)) {
    // Verify that no previously committed SQL was modified or deleted.
    const previous = JSON.parse(await readFile(manifestPath, "utf8"));

    for (const [file, oldChecksum] of Object.entries(previous.files ?? {})) {
      if (!(file in currentChecksums)) {
        failures.push(
          `Migration integrity: "${file}" was deleted (present in manifest but not on disk). Migration history must be append-only.`,
        );
      } else if (currentChecksums[file] !== oldChecksum) {
        failures.push(
          `Migration integrity: "${file}" was modified (checksum changed). Migration history must be append-only. Run "node scripts/check-schema.mjs --generate" to re-seal.`,
        );
      }
    }

    // Check for new files not in manifest (informational — these are fine in
    // append-only mode, but the manifest should be regenerated after merging).
    const newFiles = sqlFiles.filter((f) => !(f in (previous.files ?? {})));
    if (newFiles.length > 0) {
      console.warn(
        `Info: ${newFiles.length} new SQL file(s) not yet in integrity manifest: ${newFiles.join(", ")}. Run "node scripts/check-schema.mjs --generate" to include them.`,
      );
    }
  } else {
    failures.push(
      `Migration integrity manifest not found at ${manifestPath}. Run "node scripts/check-schema.mjs --generate" to create it.`,
    );
  }
} catch (err) {
  failures.push(`Migration integrity check failed: ${err.message}`);
}

// --- 2. Journal cross-reference (warning only) ---
try {
  const journalPath = join(migrations, "meta", "_journal.json");
  if (existsSync(journalPath)) {
    const journal = JSON.parse(await readFile(journalPath, "utf8"));
    const journalTags = new Set((journal.entries ?? []).map((e) => e.tag));
    const sqlFiles = (await readdir(migrations)).filter((f) => f.endsWith(".sql")).sort();
    const untracked = sqlFiles.filter((f) => {
      const base = f.replace(/\.sql$/, "");
      return ![...journalTags].some(
        (tag) => tag.startsWith(base.split("_")[0]) || base.startsWith(tag.split("_")[0]),
      );
    });
    if (untracked.length > 0) {
      console.warn(
        `Warning: ${untracked.length} SQL migration file(s) not tracked in _journal.json: ${untracked.join(", ")}`,
      );
      console.warn(
        "The runtime migrator will still apply these; the schema drift check covers the effective result.",
      );
    }
  }
} catch {
  // journal check is best-effort
}

// --- 3. Canonical schema vs committed snapshot ---
const temp = await mkdtemp(join(process.env.TMPDIR ?? "/tmp", "super-template-schema-"));
const output = join(temp, "migrations");
const config = join(temp, "drizzle.config.ts");
const drizzle = resolve(root, "packages/database-runtime/node_modules/.bin/drizzle-kit");

try {
  await mkdirOutput(output);
  for (const file of await filesUnder(migrations)) {
    if (!file.endsWith(".sql")) continue;
    await mkdir(join(output, dirname(file)), { recursive: true });
    await cp(join(migrations, file), join(output, file));
  }

  // Build schema entry from packages — use schemaRoot so tests can override.
  const packageFiles = await filesUnder(resolve(schemaRoot, "packages"));
  const schemaFiles = packageFiles
    .filter(
      (file) =>
        /^feature-[^/]+\/src\/infrastructure\/persistence\/index\.ts$/.test(file) ||
        file === "feature-outbox/src/infrastructure/persistence/outbox-messages.ts",
    )
    .map((file) => resolve(schemaRoot, "packages", file));

  const schemaEntry = join(temp, "schema.ts");
  await writeFile(
    schemaEntry,
    schemaFiles.map((file) => `export * from ${JSON.stringify(file)};`).join("\n") + "\n",
  );
  await writeFile(
    config,
    `import { defineConfig } from "drizzle-kit";\nexport default defineConfig({ schema: ${JSON.stringify(schemaEntry)}, out: "migrations", dialect: "postgresql", dbCredentials: { url: "postgresql://schema-check.invalid/schema_check" }, strict: true });\n`,
  );
  const result = await run(drizzle, ["generate", "--config", config], temp);
  if (result.code !== 0 || /Error|ERR_|Interactive prompts require/i.test(result.stderr)) {
    failures.push(
      `drizzle-kit generate failed: ${result.stderr.trim() || `exit code ${result.code}`}`,
    );
  } else {
    const committed = await filesUnder(migrations);
    const produced = await filesUnder(output);
    const committedSnapshots = committed.filter(
      (entry) => entry.startsWith("meta/") && entry.endsWith("_snapshot.json"),
    );
    const producedSnapshots = produced.filter(
      (entry) => entry.startsWith("meta/") && entry.endsWith("_snapshot.json"),
    );
    const latest = (entries) => entries.sort().at(-1);
    const committedSnapshotPath = latest(committedSnapshots);
    const producedSnapshotPath = latest(producedSnapshots);
    if (!committedSnapshotPath || !producedSnapshotPath) {
      failures.push(
        "Schema drift detected: committed and generated Drizzle snapshots are required",
      );
    } else {
      const volatileKeys = new Set(["id", "prevId", "version", "dialect"]);
      const normalizeSnapshot = (value) => {
        if (Array.isArray(value))
          return value
            .map(normalizeSnapshot)
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        if (value && typeof value === "object") {
          return Object.fromEntries(
            Object.entries(value)
              .filter(([key]) => !volatileKeys.has(key))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, child]) => [key, normalizeSnapshot(child)]),
          );
        }
        return value;
      };
      const committedRaw = JSON.parse(
        await readFile(join(migrations, committedSnapshotPath), "utf8"),
      );
      const producedRaw = JSON.parse(
        await readFile(join(output, producedSnapshotPath), "utf8"),
      );
      const committedSnapshot = normalizeSnapshot(committedRaw);
      const producedSnapshot = normalizeSnapshot(producedRaw);
      if (JSON.stringify(committedSnapshot) !== JSON.stringify(producedSnapshot)) {
        await writeFile(
          "/tmp/committed-schema.json",
          JSON.stringify(committedSnapshot, null, 2),
        );
        await writeFile(
          "/tmp/produced-schema.json",
          JSON.stringify(producedSnapshot, null, 2),
        );
        failures.push(
          "Schema drift detected: canonical Drizzle schema does not match the complete committed effective snapshot",
        );
      }
    }
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}

// --- Report ---
if (failures.length > 0) {
  for (const f of failures) console.error(f);
  process.exit(1);
}
console.log(
  "Schema check passed: canonical schemas match committed migration history and all SQL files are intact.",
);

async function mkdirOutput(directory) {
  await (await import("node:fs/promises")).mkdir(directory, { recursive: true });
}
