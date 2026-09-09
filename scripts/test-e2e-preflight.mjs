#!/usr/bin/env node
import net from "node:net";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(new URL("../apps/api/package.json", import.meta.url));
const { Client } = require("pg");

function parseDotEnv(text) {
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );
}

const fs = await import("node:fs/promises");
const envFile = await fs.readFile(".env", "utf8").catch(() => "");
const fileEnv = parseDotEnv(envFile);
const databaseUrl =
  process.env.DATABASE_URL_TEST ??
  fileEnv.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  fileEnv.DATABASE_URL;
if (!databaseUrl) {
  console.error("E2E preflight failed: DATABASE_URL_TEST is not configured.");
  process.exit(1);
}

const url = new URL(databaseUrl);
const host = url.hostname;
const port = Number(url.port || 5432);
await new Promise((resolve, reject) => {
  const socket = net.createConnection({ host, port });
  socket.setTimeout(1500);
  socket.once("connect", () => {
    socket.destroy();
    resolve();
  });
  socket.once("timeout", () => {
    socket.destroy();
    reject(new Error("timeout"));
  });
  socket.once("error", reject);
}).catch(() => {
  console.error(`E2E preflight failed: PostgreSQL is unavailable at ${host}:${port}.`);
  console.error(
    "Start it with: docker compose --env-file .env -f infra/docker-compose.yml up -d postgres",
  );
  process.exit(1);
});

const client = new Client({ connectionString: databaseUrl, connectionTimeoutMillis: 1500 });
try {
  await client.connect();
  const result = await client.query(`
    select current_database() as database, current_user as user,
           r.rolsuper as superuser, r.rolbypassrls as bypassrls
    from pg_roles r where r.rolname = current_user
  `);
  const row = result.rows[0];
  if (!row || row.superuser || row.bypassrls) {
    console.error(`E2E preflight failed: ${row?.user ?? "unknown"} bypasses RLS.`);
    console.error("Use the restricted application role in DATABASE_URL_TEST.");
    process.exit(1);
  }
  console.log(`E2E preflight passed: ${row.database} via restricted role ${row.user}.`);
} finally {
  await client.end().catch(() => undefined);
}
