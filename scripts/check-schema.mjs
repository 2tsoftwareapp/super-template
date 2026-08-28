#!/usr/bin/env node
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const root = resolve(new URL("..", import.meta.url).pathname);
const temp = await mkdtemp(join(tmpdir(), "feature-schema-check-"));
const schema = join(temp, "schema.ts");
const out = join(temp, "migrations");
const config = join(temp, "drizzle.config.ts");
const persistence = resolve(root, "packages");
const entries = [];
for (const feature of await readdir(persistence, { withFileTypes: true })) {
  if (!feature.isDirectory() || !feature.name.startsWith("feature-")) continue;
  const dir = join(persistence, feature.name, "src/infrastructure/persistence");
  try {
    const files = await readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile() && file.name.endsWith(".ts") && file.name !== "index.ts") {
        const filePath = join(dir, file.name);
        const content = await readFile(filePath, "utf8");
        if (/pgTable|pgEnum/.test(content)) {
          entries.push(`export * from ${JSON.stringify(filePath)};`);
        }
      }
    }
  } catch {
    // Features without persistence are valid.
  }
}
await writeFile(schema, `${entries.join("\n")}\n`);
await writeFile(
  config,
  `import { defineConfig } from "drizzle-kit";\nexport default defineConfig({ schema: ${JSON.stringify(schema)}, out: ${JSON.stringify(out)}, dialect: "postgresql", dbCredentials: { url: "postgresql://localhost:5432/postgres" } });\n`,
);
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
if (code !== 0) process.exit(code);
const generated = await readdir(out);
await rm(temp, { recursive: true, force: true });
if (generated.length === 0) {
  console.error("Schema check failed: Drizzle Kit emitted no migration output.");
  process.exit(1);
}
console.log("Schema check passed: canonical feature schemas are accepted by Drizzle Kit.");
