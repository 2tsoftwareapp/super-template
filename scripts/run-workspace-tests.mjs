#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const timeoutMs = Number(process.env.TEST_TIMEOUT_MS ?? 90000);
const root = process.cwd();
const workspaces = ["apps/api", "apps/admin", "apps/web", ...readdirSync("packages").map((name) => join("packages", name))];
const candidates = workspaces.filter((directory) => {
  try {
    const manifest = JSON.parse(readFileSync(join(root, directory, "package.json"), "utf8"));
    return typeof manifest.scripts?.test === "string";
  } catch {
    return false;
  }
});

const results = [];
for (const directory of candidates) {
  const started = Date.now();
  process.stdout.write(`\n[test] ${directory}\n`);
  try {
    const result = await execFileAsync("pnpm", ["test"], {
      cwd: join(root, directory),
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 8,
      env: process.env,
    });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    results.push({ directory, status: "passed", durationMs: Date.now() - started });
  } catch (error) {
    process.stdout.write(error.stdout ?? "");
    process.stderr.write(error.stderr ?? "");
    results.push({
      directory,
      status: error.killed ? "timeout" : "failed",
      durationMs: Date.now() - started,
      code: error.code,
    });
  }
}

console.log("\n[test-summary]");
for (const result of results) {
  console.log(`${result.status}\t${result.directory}\t${result.durationMs}ms${result.code ? `\t${result.code}` : ""}`);
}
const failed = results.filter((result) => result.status !== "passed");
process.exitCode = failed.length ? 1 : 0;
