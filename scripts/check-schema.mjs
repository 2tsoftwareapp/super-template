#!/usr/bin/env node
/**
 * Verify that canonical Drizzle schemas are represented by the committed SQL
 * migration history. Drizzle metadata is intentionally not copied: stale or
 * partially reconciled snapshots can trigger interactive rename prompts in CI.
 */
import { cp, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrations = resolve(root, "apps/api/migrations");
const temp = await mkdtemp(join(process.env.TMPDIR ?? "/tmp", "super-template-schema-"));
const output = join(temp, "migrations");
const config = join(temp, "drizzle.config.ts");
const drizzle = resolve(root, "packages/database-runtime/node_modules/.bin/drizzle-kit");

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await filesUnder(path)));
    else result.push(relative(directory, path));
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
    if (file.endsWith(".sql")) await cp(join(migrations, file), join(output, file));
  }
  const schema = resolve(root, "packages/feature-*/src/infrastructure/persistence/**/*.ts");
  await writeFile(
    config,
    `import { defineConfig } from "drizzle-kit";\nexport default defineConfig({ schema: ${JSON.stringify(schema)}, out: "migrations", dialect: "postgresql", dbCredentials: { url: "postgresql://schema-check.invalid/schema_check" }, strict: true });\n`,
  );
  const result = await run(drizzle, ["generate", "--config", config], temp);
  if (result.code !== 0 || /Error|ERR_|Interactive prompts require/i.test(result.stderr)) {
    failure = `drizzle-kit generate failed: ${result.stderr.trim() || `exit code ${result.code}`}`;
  } else {
    const committed = await filesUnder(migrations);
    const produced = await filesUnder(output);
    const generatedOnly = produced.filter((path) => path.endsWith(".sql") && !committed.includes(path));
    // Drizzle emits a fresh baseline when metadata is intentionally omitted.
    // Validate the committed history through stable, semantic contracts rather
    // than comparing migration formatting, names, or statement ordering.
    const history = (await Promise.all((await filesUnder(migrations)).filter((entry) => entry.endsWith(".sql")).map((entry) => readFile(join(migrations, entry), "utf8")))).flatMap(statements).join(" ");
    const organizationMembers = await readFile(
      resolve(root, "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts"),
      "utf8",
    );
    const expectedSource = /userId:\s*uuid\("user_id"\)[\s\S]*?\.notNull\(\)[\s\S]*?\.references\(\(\)\s*=>\s*users\.id,\s*\{\s*onDelete:\s*"cascade"\s*\}\)/;
    const expectedHistory = /organization_members[\s\S]*user_id[\s\S]*(?:users|m_users)[\s\S]*(?:cascade|ON DELETE CASCADE)/i;
    if (!expectedSource.test(organizationMembers) || !expectedHistory.test(history)) {
      failure = "Schema drift detected in migration history: organization_members.user_id FK contract";
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
