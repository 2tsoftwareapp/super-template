#!/usr/bin/env node
/**
 * Stack verification harness.
 *
 * Boots the real stack (docker infra, migrations, seed, production builds), starts
 * api + worker + web + admin with their own log files, then executes every
 * `test-matrix.json` row whose layer was selected and writes a machine-readable
 * result set to `.verify-stack/results.json`.
 *
 * `test-matrix.json` is the source of truth: the row registry below is checked
 * against it in both directions, so a matrix row can never silently lose its
 * implementation and an implementation can never exist without a matrix row.
 *
 * Safety model:
 * - only processes spawned by this harness are ever killed (pid tracked, process group);
 * - a port already serving a foreign process aborts the run with instructions instead of
 *   killing something we do not own;
 * - compose infra is left running, containers are never removed and no volumes are touched;
 * - every step has a timeout, so the harness cannot hang forever.
 */

import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { mergeEnvFiles, repoRoot } from "./merge-env.mjs";

const WORK_DIR = join(repoRoot, ".verify-stack");
const LOG_DIR = join(WORK_DIR, "logs");
const RESULTS_PATH = join(WORK_DIR, "results.json");
const MATRIX_PATH = join(repoRoot, "test-matrix.json");

const ALL_LAYERS = ["infra", "api", "web", "admin", "app", "cross"];

// Timeouts (ms). Probes are short and bounded; suites get the long budgets.
const TIMEOUTS = {
  compose: 300_000,
  migrate: 300_000,
  seed: 300_000,
  build: 600_000,
  probe: 20_000,
  ready: 90_000,
  row: 180_000,
  mail: 120_000,
  export: 240_000,
  throttle: 180_000,
  suite: 900_000,
  suiteLong: 1_800_000,
};

const HELP = `verify-stack - boot the stack, then run the test matrix against it

Usage
  node scripts/verify-stack.mjs [options]

Options
  --layers=<list>     Comma-separated subset of: ${ALL_LAYERS.join(", ")} (default: all)
  --only=<id,id>      Run only these matrix row ids (implies only their layers)
  --skip-build        Reuse existing build output instead of rebuilding api/worker/web/admin
  --keep-running      Leave the spawned app processes running after the run
  --json              Emit the results document on stdout (progress goes to stderr)
  --help              Show this help

What it does
  1. docker compose up -d (infra) + wait for Postgres via scripts/wait-for-postgres.sh
  2. pnpm --filter api db:migrate + db:seed against the dev database
  3. Build api, worker, web and admin (unless --skip-build)
  4. Start api, worker, web and admin on API_PORT/WEB_PORT/ADMIN_PORT from .env,
     logging each to .verify-stack/logs/<app>.log
  5. Wait for each app to answer its readiness probe
  6. Run every selected matrix row, writing .verify-stack/logs/<row-id>.log
  7. Tear down only the processes it spawned (unless --keep-running); infra stays up
  8. Print a PASS/FAIL summary and write .verify-stack/results.json

Exit codes
  0  every executed row passed (out-of-scope rows are reported as skipped)
  1  at least one row failed or was blocked
  3  setup failed (build error, occupied port, missing tool, matrix mismatch)

Notes
  - The worker host is started too: mail, jobs and export rows cannot complete without it.
  - Rows declared "out-of-scope" in test-matrix.json are reported as skipped, never as pass.
`;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const parseArgs = (argv) => {
  const options = {
    layers: [...ALL_LAYERS],
    only: [],
    skipBuild: false,
    keepRunning: false,
    json: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--skip-build") {
      options.skipBuild = true;
    } else if (arg === "--keep-running") {
      options.keepRunning = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg.startsWith("--layers=")) {
      const requested = arg
        .slice("--layers=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const unknown = requested.filter((layer) => !ALL_LAYERS.includes(layer));
      if (unknown.length > 0) {
        throw new Error(`Unknown layer(s): ${unknown.join(", ")}. Valid: ${ALL_LAYERS.join(", ")}`);
      }
      options.layers = requested;
    } else if (arg.startsWith("--only=")) {
      options.only = arg
        .slice("--only=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
};

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error.message}\n\n${HELP}`);
  process.exit(3);
}

if (options.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

/** Progress channel: stderr in --json mode so stdout stays a single JSON document. */
const out = (line = "") => {
  const stream = options.json ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
};

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const { merged } = mergeEnvFiles(repoRoot, "development");

const num = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ports = {
  api: num(process.env.API_PORT ?? merged.API_PORT, 3001),
  web: num(process.env.WEB_PORT ?? merged.WEB_PORT, 3000),
  admin: num(process.env.ADMIN_PORT ?? merged.ADMIN_PORT, 3002),
};

const base = {
  api: `http://localhost:${ports.api}`,
  web: `http://localhost:${ports.web}`,
  admin: `http://localhost:${ports.admin}`,
  mailpit: `http://localhost:${num(merged.MAILPIT_HTTP_PORT, 8025)}`,
  minio: `http://localhost:${num(merged.S3_PORT, 9000)}`,
};

const childEnv = {
  ...merged,
  ...process.env,
  APP_ENV: "development",
  API_PORT: String(ports.api),
  WEB_PORT: String(ports.web),
  ADMIN_PORT: String(ports.admin),
  NEXT_PUBLIC_WEB_URL: `http://localhost:${ports.web}`,
  WEB_ORIGIN: `http://localhost:${ports.web}`,
  API_INTERNAL_URL: `http://localhost:${ports.api}`,
};

const seedAdmin = {
  email: childEnv.SEED_ADMIN_EMAIL ?? "admin@example.local",
  password: childEnv.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
};
const seedUser = {
  email: childEnv.SEED_USER_EMAIL ?? "user@example.local",
  password: childEnv.SEED_USER_PASSWORD ?? "ChangeMe123!",
};

const stamp = Date.now();

// ---------------------------------------------------------------------------
// Process management (only ever kills what it spawned)
// ---------------------------------------------------------------------------

const spawned = new Map();
let shuttingDown = false;

const startProcess = (name, command, args, { cwd = repoRoot, env = {} } = {}) => {
  const logPath = join(LOG_DIR, `${name}.log`);
  const stream = createWriteStream(logPath, { flags: "w" });
  // detached: the child leads its own process group, so the whole tree can be signalled.
  const child = spawn(command, args, {
    cwd,
    env: { ...childEnv, ...env },
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.pipe(stream);
  child.stderr.pipe(stream);
  child.on("error", (error) => {
    stream.write(`\n[harness] spawn error: ${error.message}\n`);
  });

  spawned.set(name, { child, logPath, args: [command, ...args].join(" ") });
  return spawned.get(name);
};

const signalGroup = (child, signal) => {
  try {
    if (process.platform === "win32") {
      child.kill(signal);
      return;
    }
    process.kill(-child.pid, signal);
  } catch {
    // Already gone.
  }
};

const stopProcess = async (name, { timeoutMs = 15_000 } = {}) => {
  const entry = spawned.get(name);
  if (!entry) {
    return;
  }

  const { child } = entry;
  spawned.delete(name);

  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  signalGroup(child, "SIGTERM");

  const deadline = Date.now() + timeoutMs;
  while (child.exitCode === null && child.signalCode === null && Date.now() < deadline) {
    await sleep(200);
  }

  if (child.exitCode === null && child.signalCode === null) {
    signalGroup(child, "SIGKILL");
    await sleep(500);
  }
};

const stopAllSpawned = async () => {
  for (const name of [...spawned.keys()]) {
    await stopProcess(name);
  }
};

const teardown = async (reason) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (options.keepRunning) {
    out(`\n[harness] --keep-running: leaving ${spawned.size} process(es) running.`);
    for (const [name, entry] of spawned) {
      out(`[harness]   ${name}: pid ${entry.child.pid} (log: ${entry.logPath})`);
    }
    releaseLock();
    return;
  }

  if (spawned.size > 0) {
    out(
      `\n[harness] ${reason} - stopping ${spawned.size} harness-spawned process(es) (infra stays up).`,
    );
  }
  await stopAllSpawned();
  releaseLock();
};

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    void (async () => {
      await teardown(`received ${signal}`);
      process.exit(1);
    })();
  });
}

// ---------------------------------------------------------------------------
// Command + HTTP helpers
// ---------------------------------------------------------------------------

const run = (command, args, { cwd = repoRoot, env = {}, timeoutMs = TIMEOUTS.row, log } = {}) =>
  new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd,
      env: { ...childEnv, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    const collect = (chunk) => {
      const text = String(chunk);
      output += text;
      if (log) {
        log(text.trimEnd());
      }
    };

    child.stdout.on("data", collect);
    child.stderr.on("data", collect);

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {
        // Ignore.
      }
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        code: 1,
        output: `${output}\n[harness] spawn error: ${error.message}`,
        timedOut,
        durationMs: Date.now() - startedAt,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, output, timedOut, durationMs: Date.now() - startedAt });
    });
  });

const request = async (
  url,
  {
    method = "GET",
    token,
    json,
    headers = {},
    body,
    timeoutMs = TIMEOUTS.probe,
    redirect = "manual",
  } = {},
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...(json !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : body,
      redirect,
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }

    return {
      status: response.status,
      location: response.headers.get("location"),
      contentType: response.headers.get("content-type"),
      text,
      json: parsed,
    };
  } catch (error) {
    return { status: 0, error: error instanceof Error ? error.message : String(error), text: "" };
  } finally {
    clearTimeout(timer);
  }
};

const ensure = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const api = (path, init) => request(`${base.api}${path}`, init);

// ---------------------------------------------------------------------------
// Auth helpers (tokens are cached so rows do not burn the login rate limit)
// ---------------------------------------------------------------------------

const sessions = new Map();
const rowDiagnostics = [];

const loginWithRetry = async (email, password) => {
  const cached = sessions.get(email);
  if (cached) {
    return cached;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await api("/api/v1/auth/login", { method: "POST", json: { email, password } });

    if (response.status === 429) {
      rowDiagnostics.push(
        `login for ${email} hit the 429 rate limit (attempt ${attempt + 1}); waiting 61s for the window to clear`,
      );
      await sleep(61_000);
      continue;
    }

    ensure(
      response.status === 201,
      `login for ${email} expected 201, got ${response.status}: ${excerpt(response.text)}`,
    );
    ensure(
      typeof response.json?.data?.accessToken === "string",
      `login for ${email} returned no accessToken: ${excerpt(response.text)}`,
    );

    const session = {
      email,
      accessToken: response.json.data.accessToken,
      refreshToken: response.json.data.refreshToken,
      userId: response.json.data.user?.id,
      organizationId: response.json.data.organizationId ?? null,
      roles: response.json.data.user?.roles ?? [],
      permissions: response.json.data.permissions ?? [],
      mfaRequired: response.json.data.mfaRequired === true,
    };
    sessions.set(email, session);
    return session;
  }

  throw new Error(`login for ${email} kept returning 429 after 3 attempts`);
};

/**
 * Logs in without reusing the session cache (used where a fresh login *is* the assertion,
 * e.g. the MFA challenge). Backs off when the login rate limit answers 429.
 */
const loginUncached = async (email, password, { attempts = 3 } = {}) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await api("/api/v1/auth/login", { method: "POST", json: { email, password } });
    if (response.status !== 429) {
      return response;
    }
    rowDiagnostics.push(
      `login for ${email} hit the 429 rate limit (attempt ${attempt + 1}); waiting 61s for the window to clear`,
    );
    await sleep(61_000);
  }
  return { status: 429, json: undefined, text: "login rate limit did not clear after 3 attempts" };
};

const registerAccount = async (email, displayName, password = "ChangeMe123!") => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await api("/api/v1/auth/register", {
      method: "POST",
      json: { email, password, displayName },
    });

    if (response.status === 429) {
      rowDiagnostics.push(
        `register for ${email} hit the 429 rate limit (attempt ${attempt + 1}); waiting 61s`,
      );
      await sleep(61_000);
      continue;
    }

    return response;
  }

  throw new Error(`register for ${email} kept returning 429 after 3 attempts`);
};

/** Activates an already-registered account through the verification mail in Mailpit. */
const verifyViaMailpit = async (email) => {
  const message = await waitForMail(email, TIMEOUTS.mail);
  ensure(message !== null, `no verification mail for ${email} arrived in Mailpit`);

  const detail = await request(`${base.mailpit}/api/v1/message/${message.ID}`);
  ensure(detail.status === 200, `Mailpit message ${message.ID} returned ${detail.status}`);

  const link = `${detail.json?.Text ?? ""}\n${detail.json?.HTML ?? ""}`;
  const token = link.match(/verify-email\?token=([A-Za-z0-9_-]+)/)?.[1];
  ensure(Boolean(token), "the verification mail contains no verify-email?token= link");

  const verified = await api("/api/v1/auth/verify-email", { method: "POST", json: { token } });
  ensure(
    verified.status === 201 && verified.json?.data?.success === true,
    `verify-email expected 201 success=true, got ${verified.status}: ${excerpt(verified.text)}`,
  );

  return { message, detail };
};

/** Registers an account and activates it through the verification mail in Mailpit. */
const registerAndVerify = async (email, displayName) => {
  const registered = await registerAccount(email, displayName);
  ensure(
    registered.status === 201,
    `register for ${email} expected 201, got ${registered.status}: ${excerpt(registered.text)}`,
  );

  const activation = await verifyViaMailpit(email);
  return { registered, ...activation };
};

// ---------------------------------------------------------------------------
// TOTP (RFC 6238) for the MFA rows - plain node:crypto, no dependency
// ---------------------------------------------------------------------------

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const base32Decode = (input) => {
  const clean = input.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (const character of clean) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) {
      continue;
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const totp = (secret, at = Date.now(), timeStepSeconds = 30, digits = 6) => {
  const counter = Math.floor(at / 1000 / timeStepSeconds);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buffer.writeUInt32BE(counter % 2 ** 32, 4);

  const digest = createHmac("sha1", base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(code % 10 ** digits).padStart(digits, "0");
};

// ---------------------------------------------------------------------------
// Mailpit helpers
// ---------------------------------------------------------------------------

const mailpitMessages = async () => {
  const response = await request(`${base.mailpit}/api/v1/messages`);
  return response.json?.messages ?? [];
};

const waitForMail = async (recipient, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const messages = await mailpitMessages();
    const hit = messages.find((message) =>
      (message.To ?? []).some((entry) => entry.Address === recipient),
    );
    if (hit) {
      return hit;
    }
    await sleep(1_500);
  }
  return null;
};

const excerpt = (text, length = 400) =>
  String(text ?? "")
    .replace(/\s+/g, " ")
    .slice(0, length);

// ---------------------------------------------------------------------------
// Port guard
// ---------------------------------------------------------------------------

const portOwner = async (port) => {
  const result = await run("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fpc"], {
    timeoutMs: 15_000,
  });
  if (result.code !== 0 || !result.output.trim()) {
    return null;
  }

  const pid = result.output.match(/^p(\d+)$/m)?.[1];
  const command = result.output.match(/^c(.+)$/m)?.[1];
  return pid ? { pid, command } : null;
};

const assertPortsFree = async (names) => {
  for (const name of names) {
    const owner = await portOwner(ports[name]);
    if (owner) {
      throw new Error(
        `port ${ports[name]} (${name}) is already in use by pid ${owner.pid} (${owner.command}).\n` +
          `This harness only kills processes it spawned, so it will not touch that one.\n` +
          `Stop it yourself (e.g. \`kill ${owner.pid}\`, or the dev server / previous run) and retry.`,
      );
    }
  }
};

// ---------------------------------------------------------------------------
// Readiness probes
// ---------------------------------------------------------------------------

const waitForApiReady = async () => {
  const deadline = Date.now() + TIMEOUTS.ready;
  let last = "no response";
  while (Date.now() < deadline) {
    const response = await api("/api/v1/health");
    last = `status ${response.status}`;
    if (response.status === 200 && response.json?.data?.status === "ok") {
      return response;
    }
    await sleep(1_000);
  }
  throw new Error(`API did not become ready within ${TIMEOUTS.ready / 1000}s (${last})`);
};

const waitForHttpReady = async (name, url, needle) => {
  const deadline = Date.now() + TIMEOUTS.ready;
  let last = "no response";
  while (Date.now() < deadline) {
    const response = await request(url);
    const body = response.text ?? "";
    last = `status ${response.status}`;
    if (response.status === 200 && (!needle || body.includes(needle))) {
      return response;
    }
    await sleep(1_000);
  }
  throw new Error(`${name} did not become ready within ${TIMEOUTS.ready / 1000}s (${last})`);
};

// ---------------------------------------------------------------------------
// Row logging
// ---------------------------------------------------------------------------

/**
 * Refuses to start while another run is active.
 *
 * Runs share `.verify-stack/` (wiped at startup) and the application ports, so two
 * concurrent runs would corrupt each other's artifacts. The port guard catches the common
 * case; this lock also covers runs that need no servers (for example `--layers=cross`).
 */
const ensureNoActiveRun = () => {
  const lockPath = join(WORK_DIR, ".lock");
  if (!existsSync(lockPath)) {
    return;
  }

  const pid = Number.parseInt(readFileSync(lockPath, "utf8").trim(), 10);
  if (!Number.isFinite(pid) || pid === process.pid) {
    return;
  }

  let alive = false;
  try {
    process.kill(pid, 0);
    alive = true;
  } catch {
    alive = false;
  }

  if (alive) {
    out(`[harness] another verify-stack run is already active (pid ${pid}).`);
    out("[harness] runs share .verify-stack/ and the application ports, so they cannot overlap.");
    out("[harness] wait for it to finish, or stop it first, then retry.");
    process.exit(3);
  }
};

const writeLock = () => {
  mkdirSync(WORK_DIR, { recursive: true });
  writeFileSync(join(WORK_DIR, ".lock"), `${process.pid}\n`, "utf8");
};

const releaseLock = () => {
  rmSync(join(WORK_DIR, ".lock"), { force: true });
};

const openRowLog = (id) => {
  const path = join(LOG_DIR, `${id}.log`);
  const stream = createWriteStream(path, { flags: "w" });
  return {
    path,
    line: (text) => stream.write(`${text}\n`),
    close: () =>
      new Promise((resolve) => {
        stream.end(resolve);
      }),
  };
};

const readTail = (path, maxLines = 40) => {
  if (!existsSync(path)) {
    return "";
  }
  try {
    const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
    return lines.slice(-maxLines).join("\n").slice(-4_000);
  } catch {
    return "";
  }
};

// ---------------------------------------------------------------------------
// Row registry
// ---------------------------------------------------------------------------

const compose = (args, init) =>
  run("docker", ["compose", "-f", "infra/docker-compose.yml", ...args], init);

const psql = (query, { service = "postgres", database, log } = {}) =>
  compose(
    [
      "exec",
      "-T",
      service,
      "psql",
      "-U",
      childEnv.POSTGRES_USER ?? "postgres",
      "-d",
      database ?? childEnv.POSTGRES_DB ?? "fullstack_starter",
      "-tAc",
      query,
    ],
    { timeoutMs: 60_000, ...(log ? { log } : {}) },
  );

/** Rows that cannot reach a verdict without the worker host's schedulers. */
const REQUIRES_WORKER = new Set([
  "api-auth-register-verify-login",
  "api-mail-templated-delivery",
  "api-jobs-enqueue-and-complete",
  "api-export-create-and-download",
]);

let workerDownReason = null;

const rows = [];
const registerRow = (id, { timeoutMs = TIMEOUTS.row, run: implementation }) => {
  rows.push({ id, timeoutMs, implementation });
};

// --- infra -----------------------------------------------------------------

registerRow("infra-compose-up", {
  timeoutMs: TIMEOUTS.compose,
  run: async (log) => {
    const up = await compose(["up", "-d"], { timeoutMs: TIMEOUTS.compose, log: log.line });
    log.line(`docker compose up -d -> exit ${up.code}`);
    ensure(up.code === 0, `docker compose up -d failed with exit ${up.code}`);

    const ps = await compose(["ps", "-a", "--format", "json"], {
      timeoutMs: 60_000,
      log: log.line,
    });
    ensure(ps.code === 0, `docker compose ps failed with exit ${ps.code}`);

    const trimmed = ps.output.trim();
    const services = trimmed.startsWith("[")
      ? JSON.parse(trimmed)
      : trimmed
          .split("\n")
          .filter((line) => line.trim().startsWith("{"))
          .map((line) => JSON.parse(line));

    const required = ["postgres", "redis", "mailpit", "minio"];
    const summary = [];
    for (const name of required) {
      const service = services.find((entry) => entry.Service === name);
      const state = service?.State ?? "missing";
      const health = service?.Health ?? "";
      summary.push(`${name}=${state}${health ? `/${health}` : ""}`);
      ensure(state === "running", `compose service ${name} is ${state}, expected running`);
      if (health) {
        ensure(
          health === "healthy",
          `compose service ${name} health is ${health}, expected healthy`,
        );
      }
    }

    return summary.join(" ");
  },
});

registerRow("infra-postgres-ready", {
  timeoutMs: 90_000,
  run: async (log) => {
    const result = await run("sh", ["scripts/wait-for-postgres.sh"], {
      timeoutMs: 75_000,
      log: log.line,
    });
    ensure(result.code === 0, `scripts/wait-for-postgres.sh exited ${result.code}`);
    return `wait-for-postgres.sh exit 0 in ${result.durationMs}ms`;
  },
});

registerRow("infra-postgres-migrations-applied", {
  run: async (log) => {
    const migrationDir = join(repoRoot, "apps/api/migrations");
    const files = readdirSync(migrationDir).filter((name) => name.endsWith(".sql"));

    const applied = await psql("select count(*) from __app_migrations", { log: log.line });
    ensure(applied.code === 0, `counting __app_migrations failed: ${excerpt(applied.output)}`);
    const appliedCount = Number.parseInt(applied.output.trim(), 10);
    log.line(`applied=${appliedCount} files=${files.length}`);

    ensure(Number.isFinite(appliedCount), "could not read a numeric migration count");
    ensure(appliedCount > 0, "__app_migrations is empty: the database was never migrated");
    ensure(
      appliedCount === files.length,
      `schema drift: ${files.length} migration file(s) exist but ${appliedCount} are applied`,
    );

    return `${appliedCount} migrations applied = ${files.length} files`;
  },
});

registerRow("infra-redis-ping", {
  run: async (log) => {
    const result = await compose(["exec", "-T", "redis", "redis-cli", "PING"], {
      timeoutMs: 30_000,
      log: log.line,
    });
    ensure(result.code === 0, `redis-cli PING exited ${result.code}`);
    ensure(result.output.includes("PONG"), `redis-cli PING returned ${excerpt(result.output)}`);
    return "redis-cli PING -> PONG";
  },
});

registerRow("infra-minio-bucket-exists", {
  timeoutMs: 180_000,
  run: async (log) => {
    const bucket = childEnv.S3_BUCKET ?? "super-template-uploads";

    const health = await request(`${base.minio}/minio/health/live`);
    log.line(`GET /minio/health/live -> ${health.status}`);
    ensure(health.status === 200, `MinIO health probe returned ${health.status}`);

    // The S3 API answers 403 for both "no credentials" and "no such bucket", so bucket
    // existence is checked with the client inside the compose network instead.
    const script = [
      'mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1 || echo HARNESS_ALIAS_FAILED',
      `mc ls "local/${bucket}" >/dev/null 2>&1 && echo HARNESS_BUCKET_OK || echo HARNESS_BUCKET_MISSING`,
      `mc ls "local/definitely-missing-${stamp}" >/dev/null 2>&1 && echo HARNESS_UNKNOWN_BUCKET_FOUND || echo HARNESS_UNKNOWN_BUCKET_ABSENT`,
    ].join("; ");

    const check = await compose(
      ["run", "--rm", "--no-deps", "--entrypoint", "sh", "minio-init", "-c", script],
      { timeoutMs: 150_000, log: log.line },
    );

    const output = check.output;
    ensure(!output.includes("HARNESS_ALIAS_FAILED"), "mc could not authenticate against MinIO");
    ensure(
      output.includes("HARNESS_BUCKET_OK"),
      `bucket "${bucket}" does not exist (mc ls failed)`,
    );
    ensure(
      output.includes("HARNESS_UNKNOWN_BUCKET_ABSENT"),
      "mc claimed a nonexistent bucket exists; the probe is not trustworthy",
    );

    return `minio live, mc confirms bucket "${bucket}" exists and an unknown bucket does not`;
  },
});

registerRow("infra-mailpit-api", {
  run: async (log) => {
    const response = await request(`${base.mailpit}/api/v1/messages`);
    log.line(`GET /api/v1/messages -> ${response.status}`);
    ensure(response.status === 200, `Mailpit API returned ${response.status}`);
    ensure(
      typeof response.json?.total === "number" && Array.isArray(response.json?.messages),
      `Mailpit API body is not the expected shape: ${excerpt(response.text)}`,
    );
    return `Mailpit API 200, total=${response.json.total}`;
  },
});

registerRow("infra-topology-replica-in-recovery", {
  run: async (log) => {
    const running = await compose(["ps", "--services", "--filter", "status=running"], {
      timeoutMs: 30_000,
      log: log.line,
    });
    const services = running.output.split("\n").map((line) => line.trim());
    const replicaUp = services.includes("topology-replica");
    const primaryUp = services.includes("topology-primary");

    if (!replicaUp || !primaryUp) {
      return {
        status: "skipped",
        actual: "topology profile is not running (start it with --profile topology); not a failure",
      };
    }

    const replica = await psql("select pg_is_in_recovery()", {
      service: "topology-replica",
      log: log.line,
    });
    const primary = await psql("select pg_is_in_recovery()", {
      service: "topology-primary",
      log: log.line,
    });

    ensure(replica.code === 0, `replica query failed: ${excerpt(replica.output)}`);
    ensure(primary.code === 0, `primary query failed: ${excerpt(primary.output)}`);
    ensure(
      replica.output.includes("t"),
      `replica pg_is_in_recovery() = ${excerpt(replica.output)} (expected t)`,
    );
    ensure(
      primary.output.includes("f"),
      `primary pg_is_in_recovery() = ${excerpt(primary.output)} (expected f)`,
    );

    return "replica in recovery (t), primary primary (f)";
  },
});

// --- api -------------------------------------------------------------------

registerRow("api-health-liveness", {
  run: async (log) => {
    const response = await api("/api/v1/health");
    log.line(`GET /api/v1/health -> ${response.status} ${excerpt(response.text)}`);
    ensure(response.status === 200, `expected 200, got ${response.status}`);
    ensure(response.json?.data?.status === "ok", `data.status is ${response.json?.data?.status}`);
    ensure(Array.isArray(response.json?.data?.warnings), "data.warnings is not an array");
    return "200 data.status=ok";
  },
});

registerRow("api-health-readiness", {
  run: async (log) => {
    const response = await api("/api/v1/health/ready");
    log.line(`GET /api/v1/health/ready -> ${response.status} ${excerpt(response.text)}`);
    ensure(response.status === 200, `expected 200, got ${response.status}`);
    ensure(
      response.json?.data?.status === "ready",
      `data.status is ${response.json?.data?.status}`,
    );
    return "200 data.status=ready";
  },
});

registerRow("api-openapi-documents", {
  run: async (log) => {
    const ui = await api("/api/docs");
    log.line(`GET /api/docs -> ${ui.status} ${excerpt(ui.contentType)}`);
    ensure(ui.status === 200, `docs UI returned ${ui.status}`);

    const document = await api("/api/docs-json");
    const pathCount = Object.keys(document.json?.paths ?? {}).length;
    log.line(`GET /api/docs-json -> ${document.status}, ${pathCount} paths`);
    ensure(document.status === 200, `docs-json returned ${document.status}`);
    ensure(typeof document.json?.openapi === "string", "docs-json has no openapi version field");
    ensure(pathCount >= 50, `only ${pathCount} paths documented, expected at least 50`);

    return `docs UI 200, docs-json 200 with ${pathCount} paths`;
  },
});

registerRow("api-auth-register-verify-login", {
  timeoutMs: TIMEOUTS.mail + 60_000,
  run: async (log) => {
    const email = `matrix-verify-${stamp}@example.local`;
    const password = "ChangeMe123!";

    const registered = await registerAccount(email, "Matrix Verify");
    log.line(`POST /api/v1/auth/register -> ${registered.status} ${excerpt(registered.text)}`);
    ensure(registered.status === 201, `register expected 201, got ${registered.status}`);
    ensure(registered.json?.data?.success === true, "register did not report success=true");

    const blocked = await api("/api/v1/auth/login", { method: "POST", json: { email, password } });
    log.line(`login before verification -> ${blocked.status} ${excerpt(blocked.text)}`);
    ensure(
      blocked.status === 403 || blocked.status === 401,
      `an unverified account could log in (status ${blocked.status})`,
    );

    const activation = await verifyViaMailpit(email);
    log.line(`Mailpit message ${activation.message.ID} subject="${activation.message.Subject}"`);

    const session = await loginWithRetry(email, password);
    log.line(
      `login after verification -> roles=${JSON.stringify(session.roles)} permissions=${session.permissions.length}`,
    );
    ensure(
      session.roles.includes("USER"),
      `expected the USER role, got ${session.roles.join(",")}`,
    );
    ensure(
      !session.roles.includes("ADMIN"),
      "a self-registered account must not hold the ADMIN role",
    );

    return `register 201, unverified login ${blocked.status}, verify-email 201, login 201 roles=[USER]`;
  },
});

registerRow("api-auth-session-lifecycle", {
  run: async (log) => {
    const login = await api("/api/v1/auth/login", {
      method: "POST",
      json: { email: seedAdmin.email, password: seedAdmin.password },
    });
    log.line(`POST /api/v1/auth/login -> ${login.status}`);
    ensure(login.status === 201, `login expected 201, got ${login.status}`);
    const firstToken = login.json.data.accessToken;

    const me = await api("/api/v1/auth/me", { token: firstToken });
    log.line(`GET /api/v1/auth/me -> ${me.status}`);
    ensure(me.status === 200, `me expected 200, got ${me.status}`);
    ensure(me.json?.data?.user?.email === seedAdmin.email, "me returned the wrong user");
    ensure(
      Array.isArray(me.json?.data?.permissions) && me.json.data.permissions.length > 0,
      "me returned an empty permissions array",
    );

    const refreshed = await api("/api/v1/auth/refresh", {
      method: "POST",
      json: { refreshToken: login.json.data.refreshToken },
    });
    log.line(`POST /api/v1/auth/refresh -> ${refreshed.status}`);
    ensure(refreshed.status === 201, `refresh expected 201, got ${refreshed.status}`);
    const secondToken = refreshed.json?.data?.accessToken;
    ensure(typeof secondToken === "string", "refresh returned no accessToken");
    ensure(secondToken !== firstToken, "refresh returned the same access token");

    const logout = await api("/api/v1/auth/logout", { method: "POST", token: secondToken });
    log.line(`POST /api/v1/auth/logout -> ${logout.status}`);
    ensure(logout.status === 201, `logout expected 201, got ${logout.status}`);

    const afterLogout = await api("/api/v1/auth/me", { token: secondToken });
    log.line(
      `GET /api/v1/auth/me after logout -> ${afterLogout.status} ${excerpt(afterLogout.text)}`,
    );
    ensure(afterLogout.status === 401, `expected 401 after logout, got ${afterLogout.status}`);
    ensure(
      afterLogout.json?.error?.code === "AUTH_SESSION_REVOKED",
      `expected AUTH_SESSION_REVOKED after logout, got ${afterLogout.json?.error?.code}`,
    );

    return "login 201, me 200, refresh 201 (rotated), logout 201, me after logout 401 AUTH_SESSION_REVOKED";
  },
});

registerRow("api-auth-invalid-credentials", {
  run: async (log) => {
    const response = await api("/api/v1/auth/login", {
      method: "POST",
      json: { email: seedAdmin.email, password: "definitely-not-the-password" },
    });
    log.line(
      `POST /api/v1/auth/login (wrong password) -> ${response.status} ${excerpt(response.text)}`,
    );
    ensure(response.status === 401, `expected 401, got ${response.status}`);
    ensure(
      response.json?.error?.code === "AUTH_INVALID_CREDENTIALS",
      `unexpected error code ${response.json?.error?.code}`,
    );
    ensure(!response.json?.data?.accessToken, "a token was issued for a wrong password");
    return "401 AUTH_INVALID_CREDENTIALS, no token issued";
  },
});

registerRow("api-auth-unauthenticated-protected-route", {
  run: async (log) => {
    const results = [];
    for (const path of ["/api/v1/users/me", "/api/v1/admin/users"]) {
      const response = await api(path);
      log.line(`GET ${path} (no token) -> ${response.status} ${excerpt(response.text)}`);
      ensure(response.status === 401, `${path} expected 401, got ${response.status}`);
      ensure(
        response.json?.error?.code === "AUTH_UNAUTHORIZED",
        `${path} returned code ${response.json?.error?.code}`,
      );
      results.push(`${path}=401`);
    }
    return results.join(", ");
  },
});

registerRow("api-rbac-user-forbidden-admin-route", {
  run: async (log) => {
    const email = `matrix-rbac-${stamp}@example.local`;
    await registerAndVerify(email, "Matrix RBAC");
    const session = await loginWithRetry(email, "ChangeMe123!");

    ensure(
      session.roles.length === 1 && session.roles[0] === "USER",
      `expected a USER-only account, got ${session.roles.join(",")}`,
    );

    const forbidden = [];
    for (const path of ["/api/v1/admin/users", "/api/v1/admin/settings"]) {
      const response = await api(path, { token: session.accessToken });
      log.line(`GET ${path} as USER -> ${response.status} ${excerpt(response.text)}`);
      ensure(response.status === 403, `${path} expected 403, got ${response.status}`);
      ensure(
        response.json?.error?.code === "AUTH_FORBIDDEN",
        `${path} returned code ${response.json?.error?.code}`,
      );
      forbidden.push(path);
    }

    const allowed = await api("/api/v1/activities", { token: session.accessToken });
    log.line(`GET /api/v1/activities as USER -> ${allowed.status}`);
    ensure(
      allowed.status === 200,
      `activities should stay readable by a USER, got ${allowed.status}`,
    );

    return `${forbidden.length} admin routes 403 AUTH_FORBIDDEN, activities 200`;
  },
});

registerRow("api-tenant-isolation-cross-org", {
  timeoutMs: TIMEOUTS.row * 2,
  run: async (log) => {
    const superAdmin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const orgA = superAdmin.organizationId;
    const orgB = (await loginWithRetry(seedUser.email, seedUser.password)).organizationId;
    ensure(Boolean(orgA) && Boolean(orgB), "seeded users must both own an organization");
    ensure(orgA !== orgB, "the two seeded users share an organization; isolation cannot be proven");

    const roles = await api("/api/v1/admin/roles", { token: superAdmin.accessToken });
    ensure(roles.status === 200, `GET /api/v1/admin/roles -> ${roles.status}`);
    const adminRoleId = (roles.json?.data ?? []).find(
      (role) => role.name === "ADMIN" && role.organizationId === null,
    )?.id;
    ensure(Boolean(adminRoleId), "no platform-scoped ADMIN role found in the role catalogue");

    const created = [];
    const createOrgAdmin = async (label, organizationId, password) => {
      const email = `matrix-org-admin-${label}-${stamp}@example.local`;
      const response = await api("/api/v1/admin/users", {
        method: "POST",
        token: superAdmin.accessToken,
        json: {
          email,
          password,
          displayName: `Matrix Org Admin ${label.toUpperCase()}`,
          status: "ACTIVE",
          roleId: adminRoleId,
          organizationId,
        },
      });
      log.line(
        `POST /api/v1/admin/users (${label}) -> ${response.status} ${excerpt(response.text)}`,
      );
      ensure(response.status === 201, `creating org admin ${label} returned ${response.status}`);
      created.push({ id: response.json.data.id, email });
      return { id: response.json.data.id, email, password };
    };

    const adminA = await createOrgAdmin("a", orgA, "OrgAdminPass123!");
    const adminB = await createOrgAdmin("b", orgB, "OrgAdminPass123!");

    // Admin-created accounts must rotate their password before anything else works.
    for (const account of [adminA, adminB]) {
      const initial = await loginWithRetry(account.email, account.password);
      const changed = await api("/api/v1/users/me/password", {
        method: "PATCH",
        token: initial.accessToken,
        json: { currentPassword: account.password, newPassword: "NewPassword123!" },
      });
      log.line(`PATCH /api/v1/users/me/password (${account.email}) -> ${changed.status}`);
      ensure(changed.status === 200, `password rotation returned ${changed.status}`);
      sessions.delete(account.email);
      account.password = "NewPassword123!";
    }

    const sessionA = await loginWithRetry(adminA.email, adminA.password);

    const list = await api("/api/v1/admin/users?limit=100", { token: sessionA.accessToken });
    log.line(`GET /api/v1/admin/users as org A admin -> ${list.status}`);
    ensure(list.status === 200, `org A user listing returned ${list.status}`);
    const visibleEmails = (list.json?.data ?? []).map((user) => user.email);
    ensure(
      !visibleEmails.includes(adminB.email),
      `org A can see org B's user ${adminB.email} (leak)`,
    );

    const crossRead = await api(`/api/v1/admin/users/${adminB.id}`, {
      token: sessionA.accessToken,
    });
    log.line(`GET /api/v1/admin/users/{orgB user} as org A admin -> ${crossRead.status}`);
    ensure(crossRead.status === 403, `cross-org read expected 403, got ${crossRead.status}`);
    ensure(
      crossRead.json?.error?.code === "AUTH_FORBIDDEN",
      `unexpected error code ${crossRead.json?.error?.code}`,
    );

    // Best-effort cleanup of the accounts this row invented (never fails the row).
    for (const account of created) {
      const deleted = await api(`/api/v1/admin/users/${account.id}`, {
        method: "DELETE",
        token: superAdmin.accessToken,
      });
      log.line(`cleanup: DELETE /api/v1/admin/users/${account.id} -> ${deleted.status}`);
    }

    return `org A sees ${visibleEmails.length} users without org B's; cross-org read 403 AUTH_FORBIDDEN`;
  },
});

registerRow("api-mfa-enrollment-and-challenge", {
  timeoutMs: TIMEOUTS.mail + 90_000,
  run: async (log) => {
    const email = `matrix-mfa-${stamp}@example.local`;
    const password = "ChangeMe123!";
    await registerAndVerify(email, "Matrix MFA");
    const session = await loginWithRetry(email, password);

    const stateBefore = await api("/api/v1/auth/mfa/status", { token: session.accessToken });
    log.line(`mfa status before -> ${excerpt(stateBefore.text)}`);
    ensure(stateBefore.json?.data?.enabled === false, "the fresh account already has MFA enabled");

    const setup = await api("/api/v1/auth/mfa/setup", {
      method: "POST",
      token: session.accessToken,
    });
    log.line(`POST /api/v1/auth/mfa/setup -> ${setup.status}`);
    ensure(setup.status === 201, `setup expected 201, got ${setup.status}`);
    const secret = setup.json?.data?.secret;
    ensure(typeof secret === "string" && secret.length >= 16, "setup returned no usable secret");
    ensure(
      String(setup.json?.data?.otpauthUrl).startsWith("otpauth://totp/"),
      "setup returned no otpauth URL",
    );

    const wrongConfirm = await api("/api/v1/auth/mfa/confirm", {
      method: "POST",
      token: session.accessToken,
      json: { code: "000000" },
    });
    log.line(`confirm with 000000 -> ${wrongConfirm.status} ${excerpt(wrongConfirm.text)}`);
    ensure(wrongConfirm.status === 401, `wrong confirm expected 401, got ${wrongConfirm.status}`);
    ensure(
      wrongConfirm.json?.error?.code === "MFA_INVALID_CODE",
      `unexpected code ${wrongConfirm.json?.error?.code}`,
    );

    const confirm = await api("/api/v1/auth/mfa/confirm", {
      method: "POST",
      token: session.accessToken,
      json: { code: totp(secret) },
    });
    log.line(`confirm with a valid TOTP -> ${confirm.status}`);
    ensure(confirm.status === 201, `confirm expected 201, got ${confirm.status}`);
    const recoveryCodes = confirm.json?.data?.recoveryCodes ?? [];
    ensure(
      recoveryCodes.length >= 8,
      `expected at least 8 recovery codes, got ${recoveryCodes.length}`,
    );

    const stateAfter = await api("/api/v1/auth/mfa/status", { token: session.accessToken });
    ensure(stateAfter.json?.data?.enabled === true, "mfa status did not flip to enabled");

    sessions.delete(email);
    const challengeLogin = await loginUncached(email, password);
    log.line(`login with MFA enrolled -> ${challengeLogin.status} ${excerpt(challengeLogin.text)}`);
    ensure(
      challengeLogin.status === 201,
      `challenge login expected 201, got ${challengeLogin.status}`,
    );
    ensure(challengeLogin.json?.data?.mfaRequired === true, "mfaRequired was not true");
    ensure(
      typeof challengeLogin.json?.data?.mfaToken === "string",
      "no mfaToken returned for the challenge",
    );
    ensure(!challengeLogin.json?.data?.accessToken, "a token was issued without the second factor");
    const mfaToken = challengeLogin.json.data.mfaToken;

    const wrongChallenge = await api("/api/v1/auth/mfa/verify-challenge", {
      method: "POST",
      json: { mfaToken, code: "000000" },
    });
    log.line(`verify-challenge with 000000 -> ${wrongChallenge.status}`);
    ensure(
      wrongChallenge.status === 401,
      `wrong challenge expected 401, got ${wrongChallenge.status}`,
    );

    const goodChallenge = await api("/api/v1/auth/mfa/verify-challenge", {
      method: "POST",
      json: { mfaToken, code: totp(secret) },
    });
    log.line(`verify-challenge with a valid TOTP -> ${goodChallenge.status}`);
    ensure(
      goodChallenge.status === 201,
      `valid challenge expected 201, got ${goodChallenge.status}`,
    );
    ensure(
      typeof goodChallenge.json?.data?.accessToken === "string",
      "valid challenge issued no access token",
    );
    const challengeAccessToken = goodChallenge.json.data.accessToken;

    const replay = await api("/api/v1/auth/mfa/verify-challenge", {
      method: "POST",
      json: { mfaToken, code: totp(secret) },
    });
    log.line(`replaying the spent challenge -> ${replay.status}`);
    ensure(replay.status === 401, `replayed challenge expected 401, got ${replay.status}`);

    const disable = await api("/api/v1/auth/mfa/disable", {
      method: "POST",
      token: challengeAccessToken,
      json: { code: totp(secret) },
    });
    log.line(`POST /api/v1/auth/mfa/disable -> ${disable.status}`);
    ensure(disable.status === 201, `disable expected 201, got ${disable.status}`);

    const stateFinal = await api("/api/v1/auth/mfa/status", { token: challengeAccessToken });
    ensure(stateFinal.json?.data?.enabled === false, "MFA was left enabled after the row finished");

    return "setup 201, confirm 401 then 201 (8 recovery codes), login mfaRequired, challenge 401/201/401, disable 201";
  },
});

registerRow("api-settings-maintenance-mode-killswitch", {
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const toggle = (enabled) =>
      api("/api/v1/admin/settings/maintenance_mode", {
        method: "PATCH",
        token: admin.accessToken,
        json: { value: { enabled, message: null } },
      });

    const enabled = await toggle(true);
    log.line(`PATCH maintenance_mode enabled=true -> ${enabled.status} ${excerpt(enabled.text)}`);
    ensure(enabled.status === 200, `enabling maintenance mode returned ${enabled.status}`);

    let blocked;
    let health;
    try {
      blocked = await api("/api/v1/users/me", { token: admin.accessToken });
      health = await api("/api/v1/health");
      log.line(`/api/v1/users/me during maintenance -> ${blocked.status} ${excerpt(blocked.text)}`);
      log.line(`/api/v1/health during maintenance -> ${health.status}`);

      ensure(blocked.status === 503, `expected 503 while in maintenance, got ${blocked.status}`);
      ensure(
        blocked.json?.error?.code === "SERVICE_UNAVAILABLE",
        `unexpected error code ${blocked.json?.error?.code}`,
      );
      ensure(health.status === 200, `health must stay exempt, got ${health.status}`);
    } finally {
      const disabled = await toggle(false);
      log.line(`PATCH maintenance_mode enabled=false -> ${disabled.status}`);
      ensure(disabled.status === 200, "could not switch maintenance mode back off");
    }

    const restored = await api("/api/v1/users/me", { token: admin.accessToken });
    log.line(`/api/v1/users/me after revert -> ${restored.status}`);
    ensure(restored.status === 200, `after the revert expected 200, got ${restored.status}`);

    return "503 SERVICE_UNAVAILABLE while enabled (health exempt), 200 after revert";
  },
});

registerRow("api-settings-registration-killswitch", {
  timeoutMs: TIMEOUTS.row + 60_000,
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const toggle = (enabled) =>
      api("/api/v1/admin/settings/registration_enabled", {
        method: "PATCH",
        token: admin.accessToken,
        json: { value: { enabled } },
      });

    const email = `matrix-regswitch-${stamp}@example.local`;
    const off = await toggle(false);
    log.line(`PATCH registration_enabled enabled=false -> ${off.status}`);
    ensure(off.status === 200, `disabling registration returned ${off.status}`);

    let blocked;
    let after;
    try {
      blocked = await registerAccount(email, "Matrix Registration Switch");
      log.line(`register while disabled -> ${blocked.status} ${excerpt(blocked.text)}`);
      ensure(
        blocked.status === 403,
        `expected 403 while registration is disabled, got ${blocked.status}`,
      );
      ensure(
        String(blocked.json?.error?.code ?? "").includes("REGISTRATION_DISABLED"),
        `unexpected error code ${blocked.json?.error?.code}`,
      );
    } finally {
      const on = await toggle(true);
      log.line(`PATCH registration_enabled enabled=true -> ${on.status}`);
      ensure(on.status === 200, "could not re-enable registration");
    }

    after = await registerAccount(email, "Matrix Registration Switch");
    log.line(`register after re-enabling -> ${after.status}`);
    ensure(after.status === 201, `expected 201 after re-enabling, got ${after.status}`);

    return "register 403 while disabled, 201 after re-enabling";
  },
});

registerRow("api-files-lifecycle", {
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const fileName = `matrix-fixture-${stamp}.txt`;
    const content = `matrix harness payload ${stamp}\n`;

    const form = new FormData();
    form.append("file", new Blob([content], { type: "text/plain" }), fileName);

    const upload = await api("/api/v1/files", {
      method: "POST",
      token: admin.accessToken,
      body: form,
      timeoutMs: 30_000,
    });
    log.line(`POST /api/v1/files -> ${upload.status} ${excerpt(upload.text)}`);
    ensure(upload.status === 201, `upload expected 201, got ${upload.status}`);
    const fileId = upload.json?.data?.id;
    ensure(typeof fileId === "string", "upload returned no file id");
    ensure(upload.json.data.sizeBytes === Buffer.byteLength(content), "sizeBytes does not match");
    ensure(typeof upload.json.data.checksum === "string", "upload returned no checksum");

    const list = await api(`/api/v1/files?search=${encodeURIComponent(fileName)}`, {
      token: admin.accessToken,
    });
    log.line(`GET /api/v1/files?search -> ${list.status}, total=${list.json?.meta?.total}`);
    ensure(list.status === 200, `file list returned ${list.status}`);
    ensure(
      (list.json?.data ?? []).some((file) => file.id === fileId),
      "the uploaded file is missing from the listing",
    );

    const url = await api(`/api/v1/files/${fileId}/url`, { token: admin.accessToken });
    log.line(`GET /api/v1/files/{id}/url -> ${url.status} ${excerpt(url.text)}`);
    ensure(url.status === 200, `signed url returned ${url.status}`);
    const signedUrl = url.json?.data?.url;
    ensure(typeof signedUrl === "string" && signedUrl.includes("token="), "no signed url returned");
    ensure(url.json?.data?.expiresInSeconds > 0, "signed url has no positive expiry");

    const withSession = await request(signedUrl, { token: admin.accessToken });
    log.line(
      `GET signed url with session -> ${withSession.status}, ${withSession.text.length} bytes`,
    );
    ensure(withSession.status === 200, `signed url with session returned ${withSession.status}`);
    ensure(withSession.text === content, "downloaded bytes differ from the uploaded bytes");

    const withoutSession = await request(signedUrl);
    log.line(
      `GET signed url without session -> ${withoutSession.status} ${excerpt(withoutSession.text)}`,
    );
    ensure(
      withoutSession.status === 401,
      `the download token must not replace authentication; expected 401, got ${withoutSession.status}`,
    );

    const deleted = await api(`/api/v1/files/${fileId}`, {
      method: "DELETE",
      token: admin.accessToken,
    });
    log.line(`DELETE /api/v1/files/{id} -> ${deleted.status}`);
    ensure(deleted.status === 200, `delete returned ${deleted.status}`);

    const afterDelete = await api(`/api/v1/files?search=${encodeURIComponent(fileName)}`, {
      token: admin.accessToken,
    });
    ensure(
      !(afterDelete.json?.data ?? []).some((file) => file.id === fileId),
      "the deleted file is still listed",
    );

    return "upload 201 -> list hit -> signed url 200 byte-identical, 401 without session -> delete 200 -> gone";
  },
});

registerRow("api-files-upload-policy", {
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const form = new FormData();
    form.append(
      "file",
      new Blob(["MZ"], { type: "application/octet-stream" }),
      `matrix-${stamp}.exe`,
    );

    const response = await api("/api/v1/files", {
      method: "POST",
      token: admin.accessToken,
      body: form,
      timeoutMs: 30_000,
    });
    log.line(`POST /api/v1/files (.exe) -> ${response.status} ${excerpt(response.text)}`);
    ensure(
      response.status === 400,
      `expected 400 for a disallowed extension, got ${response.status}`,
    );
    ensure(
      /extension/i.test(String(response.json?.error?.message ?? "")),
      `the rejection does not mention the extension: ${excerpt(response.text)}`,
    );
    return "400 rejected the .exe upload";
  },
});

registerRow("api-mail-templated-delivery", {
  timeoutMs: TIMEOUTS.mail + 60_000,
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const to = `matrix-mail-${stamp}@example.local`;

    const sent = await api("/api/v1/admin/mail/send", {
      method: "POST",
      token: admin.accessToken,
      json: {
        templateKey: "auth.welcome",
        to,
        variables: { displayName: "Matrix", adminUrl: `${base.admin}/login` },
      },
    });
    log.line(`POST /api/v1/admin/mail/send -> ${sent.status} ${excerpt(sent.text)}`);
    ensure(sent.status === 201, `mail send expected 201, got ${sent.status}`);
    const jobId = sent.json?.data?.jobId;
    ensure(typeof jobId === "string", "mail send returned no jobId");

    const job = await waitForJob(jobId, admin.accessToken, TIMEOUTS.mail, log);
    ensure(
      job.status === "COMPLETED",
      `mail job ended as ${job.status}: ${job.errorMessage ?? ""}`,
    );

    const message = await waitForMail(to, 60_000);
    ensure(message !== null, `no mail for ${to} reached Mailpit`);
    log.line(`Mailpit: subject="${message.Subject}"`);
    ensure(/welcome/i.test(String(message.Subject)), `unexpected subject "${message.Subject}"`);

    const deliveries = await api("/api/v1/admin/mail/deliveries", { token: admin.accessToken });
    const delivery = (deliveries.json?.data ?? []).find((entry) => entry.recipient === to);
    log.line(
      `delivery audit -> ${delivery ? `${delivery.status} (${delivery.templateKey})` : "missing"}`,
    );
    ensure(delivery !== undefined, "no delivery audit row for the recipient");
    ensure(delivery.status === "SENT", `delivery status is ${delivery.status}`);

    return `201 jobId, job COMPLETED, Mailpit "${message.Subject}", delivery SENT`;
  },
});

registerRow("api-mail-template-guards", {
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);

    const catalogue = await api("/api/v1/admin/mail/templates", { token: admin.accessToken });
    log.line(`GET /api/v1/admin/mail/templates -> ${catalogue.status}`);
    ensure(catalogue.status === 200, `template catalogue returned ${catalogue.status}`);
    const byKey = new Map((catalogue.json?.data ?? []).map((entry) => [entry.key, entry]));
    ensure(byKey.get("auth.welcome")?.sendable === true, "auth.welcome should be sendable");
    ensure(
      byKey.get("auth.reset-password")?.sendable === false,
      "auth.reset-password should be reserved",
    );

    const reserved = await api("/api/v1/admin/mail/send", {
      method: "POST",
      token: admin.accessToken,
      json: { templateKey: "auth.reset-password", to: `matrix-reserved-${stamp}@example.local` },
    });
    log.line(`send reserved template -> ${reserved.status} ${excerpt(reserved.text)}`);
    ensure(reserved.status === 400, `reserved template expected 400, got ${reserved.status}`);

    const missingVariable = await api("/api/v1/admin/mail/send", {
      method: "POST",
      token: admin.accessToken,
      json: { templateKey: "auth.welcome", to: `matrix-missing-${stamp}@example.local` },
    });
    log.line(
      `send without variables -> ${missingVariable.status} ${excerpt(missingVariable.text)}`,
    );
    ensure(
      missingVariable.status === 400,
      `missing variable expected 400, got ${missingVariable.status}`,
    );
    ensure(
      /adminUrl/.test(String(missingVariable.json?.error?.message ?? "")),
      "the rejection does not name the missing variable",
    );

    return "catalogue flags reserved templates, 400 for reserved and for missing variables";
  },
});

const waitForJob = async (jobId, token, timeoutMs, log) => {
  const deadline = Date.now() + timeoutMs;
  let job = null;
  while (Date.now() < deadline) {
    const response = await api(`/api/v1/admin/jobs/${jobId}`, { token });
    job = response.json?.data ?? null;
    if (job && ["COMPLETED", "FAILED", "CANCELLED"].includes(job.status)) {
      return job;
    }
    await sleep(3_000);
  }
  log.line(`job ${jobId} did not reach a terminal state in ${timeoutMs}ms (last: ${job?.status})`);
  return job ?? { status: "UNKNOWN" };
};

registerRow("api-jobs-enqueue-and-complete", {
  timeoutMs: TIMEOUTS.mail + 60_000,
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);

    const sent = await api("/api/v1/admin/mail/send", {
      method: "POST",
      token: admin.accessToken,
      json: {
        templateKey: "auth.welcome",
        to: `matrix-jobs-${stamp}@example.local`,
        variables: { displayName: "Matrix Jobs", adminUrl: `${base.admin}/login` },
      },
    });
    log.line(`enqueued mail.send -> ${sent.status} ${excerpt(sent.text)}`);
    ensure(sent.status === 201, `enqueue expected 201, got ${sent.status}`);
    const jobId = sent.json.data.jobId;

    const job = await waitForJob(jobId, admin.accessToken, TIMEOUTS.mail, log);
    log.line(
      `job ${jobId}: type=${job.type} status=${job.status} attempts=${job.attempts} completedAt=${job.completedAt}`,
    );
    ensure(
      job.status === "COMPLETED",
      `job status is ${job.status} (${job.errorMessage ?? "no error"})`,
    );
    ensure(job.type === "mail.send", `job type is ${job.type}`);
    ensure(job.attempts >= 1, `job reports ${job.attempts} attempts`);
    ensure(Boolean(job.completedAt), "job has no completedAt timestamp");
    ensure(job.errorMessage === null, `job carries an error: ${job.errorMessage}`);

    const list = await api("/api/v1/admin/jobs?limit=50", { token: admin.accessToken });
    ensure(list.status === 200, `jobs list returned ${list.status}`);
    ensure(
      (list.json?.data ?? []).some((entry) => entry.id === jobId),
      "the job is missing from the admin jobs list",
    );

    return `job ${jobId} type=mail.send COMPLETED after ${job.attempts} attempt(s), present in the list`;
  },
});

registerRow("api-notifications-inbox-delivery", {
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const otherOrgUser = await loginWithRetry(seedUser.email, seedUser.password);
    const title = `Matrix notification ${stamp}`;

    // Negative first: the seeded user lives in another organization, and targeting a
    // non-member must be refused instead of silently delivered.
    const crossOrg = await api("/api/v1/admin/notifications", {
      method: "POST",
      token: admin.accessToken,
      json: {
        audience: "USER",
        userId: otherOrgUser.userId,
        type: "matrix.harness",
        title: `${title} (cross-org)`,
        body: "must be refused",
      },
    });
    log.line(`targeting a foreign-org user -> ${crossOrg.status} ${excerpt(crossOrg.text)}`);
    ensure(
      crossOrg.status === 400,
      `expected 400 for a foreign-org target, got ${crossOrg.status}`,
    );

    const sent = await api("/api/v1/admin/notifications", {
      method: "POST",
      token: admin.accessToken,
      json: {
        audience: "ALL",
        type: "matrix.harness",
        title,
        body: "delivered by verify-stack",
      },
    });
    log.line(
      `POST /api/v1/admin/notifications (audience ALL) -> ${sent.status} ${excerpt(sent.text)}`,
    );
    ensure(sent.status === 201, `notification send expected 201, got ${sent.status}`);
    ensure(sent.json?.data?.status === "COMPLETED", `job status is ${sent.json?.data?.status}`);
    ensure(sent.json?.data?.recipientCount >= 1, "recipientCount is 0");

    const inbox = await api("/api/v1/notifications?limit=50", { token: admin.accessToken });
    log.line(`sender inbox -> ${inbox.status}, total=${inbox.json?.meta?.total}`);
    ensure(inbox.status === 200, `inbox returned ${inbox.status}`);
    const received = (inbox.json?.data ?? []).find((entry) => entry.title === title);
    ensure(received !== undefined, "the notification is missing from the recipient inbox");
    ensure(received.type === "matrix.harness", `unexpected notification type ${received.type}`);

    const foreignInbox = await api("/api/v1/notifications?limit=50", {
      token: otherOrgUser.accessToken,
    });
    ensure(
      !(foreignInbox.json?.data ?? []).some((entry) => entry.title === title),
      "an org-wide notification leaked into another organization's inbox",
    );

    const unread = await api("/api/v1/notifications/unread-count", { token: admin.accessToken });
    log.line(`unread-count -> ${excerpt(unread.text)}`);
    ensure(unread.status === 200, `unread-count returned ${unread.status}`);
    ensure(unread.json?.data?.count >= 1, "unread count did not grow");

    return `foreign-org target 400, org-wide send 201 COMPLETED, inbox hit, unread=${unread.json.data.count}, no cross-org leak`;
  },
});

registerRow("api-export-create-and-download", {
  timeoutMs: TIMEOUTS.export + 60_000,
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);

    const created = await api("/api/v1/exports", {
      method: "POST",
      token: admin.accessToken,
      json: { type: "users" },
    });
    log.line(`POST /api/v1/exports -> ${created.status} ${excerpt(created.text)}`);
    ensure(created.status === 201, `export create expected 201, got ${created.status}`);
    const exportId = created.json.data.id;
    ensure(
      created.json.data.status === "PENDING",
      `new export status is ${created.json.data.status}`,
    );

    const deadline = Date.now() + TIMEOUTS.export;
    let state = created.json.data;
    while (Date.now() < deadline && !["COMPLETED", "FAILED"].includes(state.status)) {
      await sleep(3_000);
      const poll = await api(`/api/v1/exports/${exportId}`, { token: admin.accessToken });
      state = poll.json?.data ?? state;
    }
    log.line(`export ${exportId} final status=${state.status} fileId=${state.fileId}`);
    ensure(
      state.status === "COMPLETED",
      `export ended as ${state.status} - the worker never produced the file`,
    );
    ensure(typeof state.fileId === "string", "the completed export has no fileId");

    const url = await api(`/api/v1/files/${state.fileId}/url`, { token: admin.accessToken });
    ensure(url.status === 200, `signed url for the export returned ${url.status}`);
    const download = await request(url.json.data.url, { token: admin.accessToken });
    log.line(`GET export file -> ${download.status}, ${download.text.length} bytes`);
    ensure(download.status === 200, `export download returned ${download.status}`);
    const header = download.text.split("\n")[0];
    ensure(
      header.includes("email") && header.includes("displayName"),
      `unexpected CSV header "${header}"`,
    );
    ensure(
      download.text.includes(seedAdmin.email),
      "the exported CSV does not contain the seeded admin",
    );

    return `export COMPLETED, CSV header "${header.trim()}", contains ${seedAdmin.email}`;
  },
});

registerRow("api-import-confirm-commit", {
  timeoutMs: TIMEOUTS.row * 2,
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const importedEmail = `matrix-import-${stamp}@example.local`;
    const csv = `email,displayName,avatarUrl\n${importedEmail},Matrix Import,\n`;
    const fileName = `matrix-import-${stamp}.csv`;

    const form = new FormData();
    form.append("file", new Blob([csv], { type: "text/csv" }), fileName);
    const upload = await api("/api/v1/files", {
      method: "POST",
      token: admin.accessToken,
      body: form,
      timeoutMs: 30_000,
    });
    log.line(`upload CSV -> ${upload.status} ${excerpt(upload.text)}`);
    ensure(upload.status === 201, `CSV upload returned ${upload.status}`);

    const created = await api("/api/v1/imports", {
      method: "POST",
      token: admin.accessToken,
      json: { type: "users", fileId: upload.json.data.id },
    });
    log.line(`POST /api/v1/imports -> ${created.status} ${excerpt(created.text)}`);
    ensure(created.status === 201, `import create expected 201, got ${created.status}`);

    const confirmed = await api(`/api/v1/imports/${created.json.data.id}/confirm`, {
      method: "POST",
      token: admin.accessToken,
    });
    log.line(`POST /api/v1/imports/{id}/confirm -> ${confirmed.status} ${excerpt(confirmed.text)}`);
    ensure(
      confirmed.status === 200 || confirmed.status === 201,
      `confirm returned ${confirmed.status}`,
    );
    const status = confirmed.json?.data?.status;
    ensure(status === "COMPLETED", `import status is ${status} (expected COMPLETED)`);

    const found = await api(`/api/v1/admin/users?search=${encodeURIComponent(importedEmail)}`, {
      token: admin.accessToken,
    });
    log.line(`GET /api/v1/admin/users?search -> ${found.status}, total=${found.json?.meta?.total}`);
    ensure(
      (found.json?.data ?? []).some((user) => user.email === importedEmail),
      "the imported user is not visible after the import",
    );

    return `upload 201, import 201, confirm COMPLETED, ${importedEmail} visible`;
  },
});

registerRow("api-activities-and-audit-recorded", {
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);

    const activities = await api("/api/v1/activities?limit=20", { token: admin.accessToken });
    log.line(
      `GET /api/v1/activities -> ${activities.status}, total=${activities.json?.meta?.total}`,
    );
    ensure(activities.status === 200, `activities returned ${activities.status}`);
    ensure(typeof activities.json?.meta?.total === "number", "activities returned no total");

    const before = await api("/api/v1/admin/audit-logs?limit=1", { token: admin.accessToken });
    log.line(`GET /api/v1/admin/audit-logs -> ${before.status}, total=${before.json?.meta?.total}`);
    ensure(before.status === 200, `audit logs returned ${before.status}`);
    ensure(before.json?.meta?.total > 0, "the audit log is empty");
    const beforeTotal = before.json.meta.total;

    const action = await api("/api/v1/admin/notifications", {
      method: "POST",
      token: admin.accessToken,
      json: {
        audience: "USER",
        userId: admin.userId,
        type: "matrix.audit",
        title: `Matrix audit ${stamp}`,
        body: "audit trail probe",
      },
    });
    ensure(action.status === 201, `probe action returned ${action.status}`);

    const after = await api("/api/v1/admin/audit-logs?limit=1", { token: admin.accessToken });
    log.line(
      `audit total after the probe action -> ${after.json?.meta?.total} (before ${beforeTotal})`,
    );
    ensure(
      after.json?.meta?.total > beforeTotal,
      `audit total did not grow (${beforeTotal} -> ${after.json?.meta?.total})`,
    );

    const rows2 = await api("/api/v1/admin/audit-logs?limit=5", { token: admin.accessToken });
    const sample = (rows2.json?.data ?? [])[0];
    ensure(Boolean(sample?.action), "audit rows carry no action field");
    ensure(
      Boolean(sample?.resourceType ?? sample?.entityType),
      "audit rows carry no resource type",
    );

    return `activities 200, audit total ${beforeTotal} -> ${after.json.meta.total} after the action`;
  },
});

registerRow("api-errors-validation", {
  run: async (log) => {
    const response = await api("/api/v1/auth/login", {
      method: "POST",
      json: { email: "not-an-email", unexpectedField: "nope" },
    });
    log.line(
      `POST /api/v1/auth/login (invalid payload) -> ${response.status} ${excerpt(response.text)}`,
    );
    ensure(response.status === 400, `expected 400, got ${response.status}`);
    ensure(
      response.json?.error?.code === "VALIDATION_FAILED",
      `unexpected error code ${response.json?.error?.code}`,
    );
    ensure(
      Array.isArray(response.json?.error?.details) && response.json.error.details.length > 0,
      "the validation error carries no field details",
    );
    ensure(
      response.status !== 422,
      "the API answered 422: the platform contract is 400 for payload validation",
    );
    return `400 VALIDATION_FAILED with ${response.json.error.details.length} detail(s)`;
  },
});

registerRow("api-errors-not-found", {
  run: async (log) => {
    const response = await api("/api/v1/this-route-does-not-exist");
    log.line(
      `GET /api/v1/this-route-does-not-exist -> ${response.status} ${excerpt(response.text)}`,
    );
    ensure(response.status === 404, `expected 404, got ${response.status}`);
    ensure(
      /cannot (get|post)/i.test(String(response.json?.error?.message ?? "")),
      `the 404 body does not describe the missing route: ${excerpt(response.text)}`,
    );
    ensure(!/\bat\s+\w+.*:\d+:\d+/.test(response.text), "the 404 body leaks a stack trace");
    return "404 with a route description and no stack trace";
  },
});

registerRow("api-errors-conflict", {
  timeoutMs: TIMEOUTS.row + 60_000,
  run: async (log) => {
    const email = `matrix-conflict-${stamp}@example.local`;
    const first = await registerAccount(email, "Matrix Conflict");
    log.line(`first register -> ${first.status}`);
    ensure(first.status === 201, `first register expected 201, got ${first.status}`);

    const second = await registerAccount(email, "Matrix Conflict");
    log.line(`second register -> ${second.status} ${excerpt(second.text)}`);
    ensure(second.status === 409, `duplicate register expected 409, got ${second.status}`);
    ensure(
      second.json?.error?.code === "USER_EMAIL_ALREADY_EXISTS",
      `unexpected error code ${second.json?.error?.code}`,
    );
    return "201 then 409 USER_EMAIL_ALREADY_EXISTS";
  },
});

/**
 * Restores a usable login window.
 *
 * Tripping the login limit also sets a Redis block key for the full window (60s), which
 * would fail the *next* row that logs in - the Playwright admin smoke spec signs in through
 * the UI. Clearing the counters restores it immediately; if Redis is not backing the
 * limiter (in-process fallback) the block is waited out instead, and the outcome is proven
 * with a probe request rather than assumed.
 */
const ensureLoginWindowUsable = async (log) => {
  const reset = await resetThrottleState();
  log.line(`cleanup: ${reset}`);

  const probe = () =>
    api("/api/v1/auth/login", {
      method: "POST",
      json: { email: `matrix-window-probe-${stamp}@example.local`, password: "wrong-password" },
    });

  const first = await probe();
  log.line(`cleanup: probe login -> ${first.status}`);
  if (first.status !== 429) {
    return `login window usable again (probe ${first.status})`;
  }

  log.line("cleanup: still blocked after the counter reset; waiting 61s for the block to expire");
  await sleep(61_000);
  const second = await probe();
  log.line(`cleanup: probe after waiting -> ${second.status}`);
  ensure(second.status !== 429, "the login window is still blocked; later rows would fail");

  return "login window usable again after waiting out the block";
};

registerRow("api-throttling-429", {
  timeoutMs: TIMEOUTS.throttle,
  run: async (log) => {
    // The login route allows 5 requests per 60s. Earlier rows also log in, so wait a
    // full window first: that makes the measurement below about the limit itself
    // rather than about whatever the previous row happened to leave behind.
    log.line("waiting 61s for a guaranteed-clear login rate-limit window");
    await sleep(61_000);

    const statuses = [];
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const response = await api("/api/v1/auth/login", {
        method: "POST",
        json: { email: `matrix-throttle-${stamp}@example.local`, password: "wrong-password" },
      });
      statuses.push(response.status);
      log.line(`attempt ${attempt} -> ${response.status} ${excerpt(response.text, 140)}`);

      if (attempt === 6) {
        ensure(response.status === 429, `attempt 6 expected 429, got ${response.status}`);
        ensure(
          /too many requests/i.test(String(response.json?.error?.message ?? "")),
          `the 429 body does not mention rate limiting: ${excerpt(response.text)}`,
        );
      }
    }

    ensure(
      statuses.slice(0, 5).every((status) => status === 401),
      `attempts 1-5 should all be 401 (wrong password), got ${statuses.join(",")}`,
    );

    // Leave the login window usable: tripping the limit also blocks the route for the rest
    // of the window, and the rows that follow (including the Playwright suite) still sign in.
    const restored = await ensureLoginWindowUsable(log);

    return `statuses ${statuses.join(",")} - the 5/60s login limit engages on attempt 6; ${restored}`;
  },
});

// --- web -------------------------------------------------------------------

registerRow("web-home-page", {
  run: async (log) => {
    const root = await request(`${base.web}/`);
    log.line(`GET / -> ${root.status} location=${root.location}`);
    ensure(
      root.status >= 300 && root.status < 400,
      `expected a locale redirect, got ${root.status}`,
    );
    ensure(
      String(root.location ?? "").includes("/en"),
      `the redirect does not point at the default locale: ${root.location}`,
    );

    const home = await request(`${base.web}/en`);
    log.line(`GET /en -> ${home.status}, ${home.text.length} bytes`);
    ensure(home.status === 200, `/en returned ${home.status}`);
    ensure(/Super Template/i.test(home.text), "the landing page does not render the product name");

    return `redirect to ${root.location}, /en 200 with landing content`;
  },
});

registerRow("web-locale-vi-page", {
  run: async (log) => {
    const response = await request(`${base.web}/vi`);
    log.line(`GET /vi -> ${response.status}, ${response.text.length} bytes`);
    ensure(response.status === 200, `/vi returned ${response.status}`);
    ensure(/<html/i.test(response.text), "/vi did not return an HTML document");
    return "/vi 200 HTML";
  },
});

registerRow("web-login-route-not-hosted", {
  run: async (log) => {
    const login = await request(`${base.web}/login`);
    log.line(`GET /login -> ${login.status} location=${login.location}`);
    ensure(
      login.status >= 300 && login.status < 400,
      `expected a locale redirect for /login, got ${login.status}`,
    );

    const localized = await request(`${base.web}/en/login`);
    log.line(`GET /en/login -> ${localized.status}`);
    ensure(
      localized.status === 404,
      `web /en/login expected 404 (no login page), got ${localized.status}`,
    );

    const home = await request(`${base.web}/en`);
    ensure(
      /admin/i.test(home.text),
      "the landing page does not point at the admin app for sign-in",
    );

    return `/login -> ${login.location}, /en/login 404 as designed, landing links to admin`;
  },
});

registerRow("web-e2e-playwright-suite", {
  timeoutMs: TIMEOUTS.suite,
  run: async (log) => {
    const result = await run("pnpm", ["--filter", "web", "test:e2e"], {
      timeoutMs: TIMEOUTS.suite,
      log: log.line,
      env: {
        PLAYWRIGHT_SKIP_WEBSERVER: "1",
        PLAYWRIGHT_BASE_URL: base.web,
        PLAYWRIGHT_ADMIN_URL: base.admin,
      },
    });
    ensure(!result.timedOut, `playwright timed out after ${TIMEOUTS.suite / 1000}s`);
    ensure(result.code === 0, `playwright exited ${result.code}`);
    return `playwright exit 0 in ${Math.round(result.durationMs / 1000)}s`;
  },
});

// --- admin -----------------------------------------------------------------

const adminCookie = async () => {
  const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
  return `st_admin_refresh_token=${admin.refreshToken}`;
};

registerRow("admin-login-page-renders", {
  run: async (log) => {
    const response = await request(`${base.admin}/en/login`);
    log.line(`GET /en/login -> ${response.status}, ${response.text.length} bytes`);
    ensure(response.status === 200, `/en/login returned ${response.status}`);
    ensure(/<html/i.test(response.text), "/en/login did not return an HTML document");
    ensure(/<title>Super Admin<\/title>/.test(response.text), "the admin shell title is missing");
    log.line(
      "note: the login form is client-rendered, so its copy is asserted by the browser suite",
    );

    return "200 HTML shell (title Super Admin); form copy covered by the Playwright suite";
  },
});

registerRow("admin-protected-route-redirects", {
  run: async (log) => {
    const results = [];
    for (const path of ["/en/users", "/users"]) {
      const response = await request(`${base.admin}${path}`);
      log.line(`GET ${path} (no cookie) -> ${response.status} location=${response.location}`);
      ensure(
        response.status >= 300 && response.status < 400,
        `${path} expected a redirect, got ${response.status}`,
      );
      ensure(
        String(response.location ?? "").includes("/login"),
        `${path} redirected to ${response.location}, expected the login route`,
      );
      results.push(`${path}->${response.location}`);
    }
    return results.join(", ");
  },
});

registerRow("admin-dashboard-with-session-cookie", {
  run: async (log) => {
    const cookie = await adminCookie();

    const anonymous = await request(`${base.admin}/en`);
    log.line(`GET /en (no cookie) -> ${anonymous.status} location=${anonymous.location}`);
    ensure(
      anonymous.status >= 300 && anonymous.status < 400,
      `anonymous /en expected a login redirect, got ${anonymous.status}`,
    );

    const authenticated = await request(`${base.admin}/en`, { headers: { cookie } });
    log.line(
      `GET /en (refresh cookie) -> ${authenticated.status}, ${authenticated.text.length} bytes`,
    );
    ensure(
      authenticated.status === 200,
      `/en with a session cookie returned ${authenticated.status}`,
    );
    ensure(/<html/i.test(authenticated.text), "the admin shell did not render HTML");

    return `anonymous redirect ${anonymous.location}, with cookie 200 HTML`;
  },
});

registerRow("admin-main-routes-render", {
  run: async (log) => {
    const cookie = await adminCookie();
    const paths = [
      "/en/users",
      "/en/roles",
      "/en/audit-logs",
      "/en/settings",
      "/en/jobs",
      "/en/mail",
    ];

    const results = [];
    for (const path of paths) {
      const response = await request(`${base.admin}${path}`, { headers: { cookie } });
      log.line(`GET ${path} -> ${response.status}, ${response.text.length} bytes`);
      ensure(response.status === 200, `${path} returned ${response.status}`);
      ensure(/<html/i.test(response.text), `${path} did not return an HTML document`);
      results.push(`${path}=200`);
    }

    return results.join(", ");
  },
});

registerRow("admin-api-super-admin-access", {
  run: async (log) => {
    const admin = await loginWithRetry(seedAdmin.email, seedAdmin.password);
    const paths = [
      "/api/v1/admin/users",
      "/api/v1/admin/roles",
      "/api/v1/admin/audit-logs",
      "/api/v1/admin/settings",
      "/api/v1/admin/jobs",
    ];

    const results = [];
    for (const path of paths) {
      const response = await api(path, { token: admin.accessToken });
      log.line(`GET ${path} -> ${response.status} ${excerpt(response.text, 120)}`);
      ensure(response.status === 200, `${path} returned ${response.status}`);
      ensure(response.json?.error === undefined, `${path} returned an error envelope`);
      results.push(`${path}=200`);
    }

    return `${results.length} admin endpoints 200`;
  },
});

// --- app -------------------------------------------------------------------

const flutterEnv = (() => {
  const candidates = [
    process.env.FLUTTER_BIN,
    join(process.env.HOME ?? "", "develop/flutter/bin"),
    join(process.env.HOME ?? "", "flutter/bin"),
    "/opt/homebrew/bin",
    "/usr/local/bin",
  ].filter(Boolean);

  const existing = candidates.find((dir) => existsSync(join(dir, "flutter")));
  if (!existing) {
    return { PATH: childEnv.PATH, found: null };
  }
  return { PATH: `${existing}:${childEnv.PATH}`, found: existing };
})();

const requireFlutter = (log) => {
  log.line(`flutter bin dir: ${flutterEnv.found ?? "not found on PATH"}`);
  ensure(
    flutterEnv.found !== null,
    "Flutter SDK was not found; install it or set FLUTTER_BIN so mobile rows can run",
  );
};

registerRow("app-mobile-check", {
  timeoutMs: TIMEOUTS.suite,
  run: async (log) => {
    requireFlutter(log);
    const result = await run("pnpm", ["run", "mobile:check"], {
      timeoutMs: TIMEOUTS.suite,
      log: log.line,
      env: { PATH: flutterEnv.PATH },
    });
    ensure(!result.timedOut, `mobile:check timed out after ${TIMEOUTS.suite / 1000}s`);
    ensure(result.code === 0, `mobile:check exited ${result.code}`);
    return `dart format + flutter analyze + flutter test exit 0 in ${Math.round(result.durationMs / 1000)}s`;
  },
});

registerRow("app-mobile-build-apk", {
  timeoutMs: TIMEOUTS.suiteLong,
  run: async (log) => {
    requireFlutter(log);
    const result = await run("pnpm", ["run", "mobile:build"], {
      timeoutMs: TIMEOUTS.suiteLong,
      log: log.line,
      env: { PATH: flutterEnv.PATH },
    });
    ensure(!result.timedOut, `mobile:build timed out after ${TIMEOUTS.suiteLong / 1000}s`);
    ensure(result.code === 0, `mobile:build exited ${result.code}`);

    const apk = join(repoRoot, "apps/mobile/build/app/outputs/flutter-apk/app-release.apk");
    ensure(existsSync(apk), `release APK not found at ${apk}`);
    const size = statSync(apk).size;
    ensure(size > 0, "the release APK is empty");
    log.line(`APK ${apk} (${size} bytes)`);

    return `flutter build apk --release exit 0, APK ${(size / 1024 / 1024).toFixed(1)} MB`;
  },
});

// --- cross -----------------------------------------------------------------

const suiteRow = (id, args, timeoutMs, describe) => {
  registerRow(id, {
    timeoutMs,
    run: async (log) => {
      const result = await run("pnpm", args, { timeoutMs, log: log.line });
      ensure(!result.timedOut, `${describe} timed out after ${timeoutMs / 1000}s`);
      ensure(result.code === 0, `${describe} exited ${result.code}`);
      return `${describe} exit 0 in ${Math.round(result.durationMs / 1000)}s`;
    },
  });
};

suiteRow("cross-lint-policy", ["run", "lint:policy"], TIMEOUTS.suite, "pnpm run lint:policy");
suiteRow(
  "cross-typecheck",
  ["exec", "turbo", "run", "typecheck"],
  TIMEOUTS.suite,
  "turbo run typecheck",
);
suiteRow(
  "cross-unit-tests",
  ["exec", "turbo", "run", "test"],
  TIMEOUTS.suiteLong,
  "turbo run test",
);
suiteRow("cross-schema-check", ["run", "schema:check"], 300_000, "pnpm run schema:check");
suiteRow("cross-generate-check", ["run", "generate:check"], 600_000, "pnpm run generate:check");
suiteRow(
  "cross-api-e2e-suite",
  ["--filter", "api", "test:e2e"],
  TIMEOUTS.suiteLong,
  "api test:e2e",
);
suiteRow("cross-format-check", ["run", "format:check"], 300_000, "pnpm run format:check");

// ---------------------------------------------------------------------------
// Matrix / registry parity
// ---------------------------------------------------------------------------

const matrix = JSON.parse(readFileSync(MATRIX_PATH, "utf8"));
const matrixRows = matrix.rows;
const registryById = new Map(rows.map((row) => [row.id, row]));

const matrixIds = new Set(matrixRows.map((row) => row.id));
const executableMatrixRows = matrixRows.filter((row) => row.automation !== "out-of-scope");

const missingImplementation = executableMatrixRows
  .filter((row) => !registryById.has(row.id))
  .map((row) => row.id);
const orphanImplementation = rows.filter((row) => !matrixIds.has(row.id)).map((row) => row.id);
const duplicateIds = matrixRows
  .map((row) => row.id)
  .filter((id, index, all) => all.indexOf(id) !== index);

if (
  duplicateIds.length > 0 ||
  missingImplementation.length > 0 ||
  orphanImplementation.length > 0
) {
  const problems = [];
  if (duplicateIds.length > 0) {
    problems.push(`duplicate matrix ids: ${duplicateIds.join(", ")}`);
  }
  if (missingImplementation.length > 0) {
    problems.push(`matrix rows without an implementation: ${missingImplementation.join(", ")}`);
  }
  if (orphanImplementation.length > 0) {
    problems.push(`implementations without a matrix row: ${orphanImplementation.join(", ")}`);
  }
  out(`[harness] test-matrix.json and the row registry disagree:\n  - ${problems.join("\n  - ")}`);
  process.exit(3);
}

// Selection
const selectedRows = matrixRows.filter((row) => {
  if (options.only.length > 0) {
    return options.only.includes(row.id);
  }
  return options.layers.includes(row.layer);
});

if (selectedRows.length === 0) {
  out("[harness] no matrix row matches the selection; nothing to do.");
  process.exit(3);
}

const unknownOnly = options.only.filter((id) => !matrixIds.has(id));
if (unknownOnly.length > 0) {
  out(`[harness] unknown --only ids: ${unknownOnly.join(", ")}`);
  process.exit(3);
}

const selectedLayers = [...new Set(selectedRows.map((row) => row.layer))];
const needsServers = selectedRows.some((row) => ["api", "web", "admin"].includes(row.layer));
const needsInfra =
  selectedRows.some((row) => row.layer !== "cross") ||
  selectedRows.some((row) => row.id === "cross-api-e2e-suite");
const needsWebApp = selectedRows.some((row) => row.layer === "web" || row.layer === "admin");

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const setupLog = (name) => {
  const path = join(LOG_DIR, `setup-${name}.log`);
  const stream = createWriteStream(path, { flags: "w" });
  return {
    path,
    line: (text) => stream.write(`${text}\n`),
    close: () => new Promise((r) => stream.end(r)),
  };
};

/**
 * Clears the rate-limit counters in Redis.
 *
 * The throttler storage is Redis-backed (`throttle:*` keys), so buckets survive API
 * restarts. The auth routes carry strict limits - `POST /auth/verify-email` allows 10 per
 * hour - and a few harness runs inside that hour would otherwise exhaust them and report a
 * false failure for rows that merely need to verify an account. Only rate-limit counters
 * are removed; nothing else in Redis is touched. A missing Redis is not fatal: the storage
 * then falls back to per-process counters, which start clean anyway.
 */
const resetThrottleState = async () => {
  const log = setupLog("throttle-reset");

  try {
    const scan = await compose(
      ["exec", "-T", "redis", "redis-cli", "--scan", "--pattern", "throttle:*"],
      { timeoutMs: 60_000, log: log.line },
    );

    if (scan.code !== 0) {
      log.line(`redis scan exited ${scan.code}; skipping the reset`);
      return "skipped (redis not reachable)";
    }

    const keys = scan.output
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("throttle:"));

    if (keys.length === 0) {
      return "no counter to clear";
    }

    let deleted = 0;
    for (let index = 0; index < keys.length; index += 200) {
      const batch = keys.slice(index, index + 200);
      const removed = await compose(["exec", "-T", "redis", "redis-cli", "DEL", ...batch], {
        timeoutMs: 60_000,
        log: log.line,
      });
      log.line(`DEL ${batch.length} key(s) -> exit ${removed.code}: ${removed.output.trim()}`);
      deleted += batch.length;
    }

    return `cleared ${deleted} rate-limit key(s)`;
  } catch (error) {
    log.line(`reset failed: ${error instanceof Error ? error.message : String(error)}`);
    return "skipped (reset error)";
  } finally {
    await log.close();
  }
};

const runStep = async (name, command, args, timeoutMs, extraEnv = {}) => {
  const log = setupLog(name);
  out(`[setup] ${name}: ${command} ${args.join(" ")}`);
  const result = await run(command, args, {
    timeoutMs,
    env: extraEnv,
    log: (text) => log.line(text),
  });
  await log.close();
  if (result.timedOut) {
    throw new Error(`${name} timed out after ${timeoutMs / 1000}s (see ${log.path})`);
  }
  if (result.code !== 0) {
    throw new Error(`${name} failed with exit ${result.code} (see ${log.path})`);
  }
  out(`[setup] ${name}: ok in ${Math.round(result.durationMs / 1000)}s`);
  return result;
};

const startedAt = new Date();
const results = [];

const main = async () => {
  ensureNoActiveRun();
  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(LOG_DIR, { recursive: true });
  writeLock();

  out(`[harness] repo ${repoRoot}`);
  out(`[harness] ports api=${ports.api} web=${ports.web} admin=${ports.admin}`);
  out(
    `[harness] selected layers: ${selectedLayers.join(", ")} (${selectedRows.length} matrix rows)` +
      (options.skipBuild ? ", --skip-build" : ""),
  );

  if (needsInfra) {
    await runStep(
      "infra-up",
      "docker",
      ["compose", "-f", "infra/docker-compose.yml", "up", "-d"],
      TIMEOUTS.compose,
    );
    await runStep("infra-wait", "sh", ["scripts/wait-for-postgres.sh"], 90_000);
    const throttleReset = await resetThrottleState();
    out(`[setup] throttle-reset: ${throttleReset}`);
    await runStep("migrate", "pnpm", ["--filter", "api", "db:migrate"], TIMEOUTS.migrate);
    await runStep("seed", "pnpm", ["--filter", "api", "db:seed"], TIMEOUTS.seed);
  }

  if (needsServers) {
    // Refuse to fight over a port before spending minutes on builds.
    const portsToCheck = ["api", ...(needsWebApp ? ["web", "admin"] : [])];
    try {
      await assertPortsFree(portsToCheck);
    } catch (error) {
      out(`\n[harness] ${error.message}`);
      process.exit(3);
    }

    if (!options.skipBuild) {
      for (const app of ["api", "worker", ...(needsWebApp ? ["web", "admin"] : [])]) {
        await runStep(`build-${app}`, "pnpm", ["--filter", app, "build"], TIMEOUTS.build);
      }
    }

    out("\n[harness] starting applications");
    startProcess("api", "pnpm", ["--filter", "api", "start"]);
    // The worker host owns the schedulers (outbox, jobs, exports, notifications);
    // mail/jobs/export rows cannot reach a terminal state without it.
    startProcess("worker", "pnpm", ["--filter", "worker", "start"]);

    if (needsWebApp) {
      startProcess("web", "pnpm", ["--filter", "web", "start"]);
      startProcess("admin", "pnpm", ["--filter", "admin", "start"]);
    }

    await waitForApiReady();
    out(`[harness] api ready on ${base.api}`);

    if (needsWebApp) {
      await waitForHttpReady("web", `${base.web}/en`, "Super Template");
      out(`[harness] web ready on ${base.web}`);
      await waitForHttpReady("admin", `${base.admin}/en/login`, "Super Admin");
      out(`[harness] admin ready on ${base.admin}`);
    }

    // A worker that dies at boot is an infrastructure problem, not a product failure: the
    // queue-dependent rows below are reported as blocked so nobody reads "broken" into a
    // missing scheduler.
    const workerProcess = spawned.get("worker")?.child;
    if (workerProcess && workerProcess.exitCode !== null) {
      workerDownReason = `the worker host exited during startup (code ${workerProcess.exitCode}); see ${
        spawned.get("worker")?.logPath ?? ".verify-stack/logs/worker.log"
      }`;
      out(`[harness] WARNING: ${workerDownReason}`);
      out("[harness] queue-dependent rows will be reported as blocked");
    }
  }

  out(`\n[harness] running ${selectedRows.length} matrix row(s)\n`);
  out(`${"ID".padEnd(44)}${"LAYER".padEnd(8)}${"SEV".padEnd(5)}${"STATUS".padEnd(9)}DETAIL`);
  out("-".repeat(120));

  for (const matrixRow of selectedRows) {
    const started = Date.now();
    const registryRow = registryById.get(matrixRow.id);
    const log = openRowLog(matrixRow.id);
    log.line(`# ${matrixRow.id} (${matrixRow.layer}, ${matrixRow.severity})`);
    log.line(`name: ${matrixRow.name}`);
    log.line(`action: ${matrixRow.action}`);
    log.line(`expect: ${matrixRow.expect}`);
    log.line("");

    let status = "pass";
    let actual = "";

    try {
      if (matrixRow.automation === "out-of-scope") {
        status = "skipped";
        actual = "declared out-of-scope in test-matrix.json";
        log.line(`out of scope: ${matrixRow.expect}`);
      } else if (workerDownReason !== null && REQUIRES_WORKER.has(matrixRow.id)) {
        status = "blocked";
        actual = `blocked by infrastructure: ${workerDownReason}`;
        log.line(`blocked: ${actual}`);
      } else {
        const outcome = await withTimeout(
          registryRow.implementation(log),
          registryRow.timeoutMs,
          matrixRow.id,
        );

        if (outcome && typeof outcome === "object" && outcome.status) {
          status = outcome.status;
          actual = outcome.actual ?? "";
        } else {
          actual = String(outcome);
        }
      }
    } catch (error) {
      status = "fail";
      actual = error instanceof Error ? error.message : String(error);
    }

    for (const diagnostic of rowDiagnostics.splice(0)) {
      log.line(`[diagnostic] ${diagnostic}`);
    }

    const durationMs = Date.now() - started;
    await log.close();

    const failed = status === "fail";
    results.push({
      id: matrixRow.id,
      layer: matrixRow.layer,
      name: matrixRow.name,
      severity: matrixRow.severity,
      automation: matrixRow.automation,
      expect: matrixRow.expect,
      status,
      durationMs,
      actual,
      evidencePath: log.path,
      logExcerpt: failed ? readTail(log.path) : null,
    });

    const statusLabel =
      status === "pass" ? "PASS" : status === "skipped" ? "SKIP" : status.toUpperCase();
    out(
      `${matrixRow.id.padEnd(44)}${matrixRow.layer.padEnd(8)}${matrixRow.severity.padEnd(5)}${statusLabel.padEnd(9)}${excerpt(actual, 70)}`,
    );
  }
};

const withTimeout = (promise, timeoutMs, id) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`row ${id} exceeded its ${timeoutMs / 1000}s timeout`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

// ---------------------------------------------------------------------------
// Summary + report
// ---------------------------------------------------------------------------

const printSummary = () => {
  const byLayer = {};
  for (const result of results) {
    byLayer[result.layer] ??= { pass: 0, fail: 0, skipped: 0, blocked: 0 };
    byLayer[result.layer][result.status] = (byLayer[result.layer][result.status] ?? 0) + 1;
  }

  const totals = { pass: 0, fail: 0, skipped: 0, blocked: 0 };
  for (const counts of Object.values(byLayer)) {
    for (const [key, value] of Object.entries(counts)) {
      totals[key] += value;
    }
  }

  out("");
  out("Summary by layer");
  out("-".repeat(60));
  out(
    `${"LAYER".padEnd(10)}${"PASS".padStart(6)}${"FAIL".padStart(6)}${"SKIP".padStart(6)}${"BLOCKED".padStart(9)}`,
  );
  for (const layer of ALL_LAYERS) {
    const counts = byLayer[layer];
    if (!counts) {
      continue;
    }
    out(
      `${layer.padEnd(10)}${String(counts.pass).padStart(6)}${String(counts.fail).padStart(6)}${String(counts.skipped).padStart(6)}${String(counts.blocked).padStart(9)}`,
    );
  }
  out("-".repeat(60));
  out(
    `${"TOTAL".padEnd(10)}${String(totals.pass).padStart(6)}${String(totals.fail).padStart(6)}${String(totals.skipped).padStart(6)}${String(totals.blocked).padStart(9)}`,
  );

  const failures = results.filter(
    (result) => result.status === "fail" || result.status === "blocked",
  );
  if (failures.length > 0) {
    out("\nFailures");
    out("-".repeat(60));
    for (const failure of failures) {
      out(`${failure.id} (${failure.layer}, ${failure.severity}) [${failure.status}]`);
      out(`  ${failure.actual}`);
      out(`  evidence: ${failure.evidencePath}`);
    }
  }

  const skipped = results.filter((result) => result.status === "skipped");
  if (skipped.length > 0) {
    out("\nSkipped (declared out-of-scope or not applicable)");
    out("-".repeat(60));
    for (const entry of skipped) {
      out(`${entry.id} (${entry.layer}): ${entry.actual}`);
    }
  }

  const diagnostics = rowDiagnostics.splice(0);
  if (diagnostics.length > 0) {
    out("\nHarness diagnostics");
    out("-".repeat(60));
    for (const diagnostic of diagnostics) {
      out(`- ${diagnostic}`);
    }
  }

  return { byLayer, totals };
};

const writeResults = (summary) => {
  const document = {
    harness: "scripts/verify-stack.mjs",
    matrix: "test-matrix.json",
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    environment: {
      apiPort: ports.api,
      webPort: ports.web,
      adminPort: ports.admin,
      skipBuild: options.skipBuild,
      keepRunning: options.keepRunning,
      selectedLayers,
      selectedRows: selectedRows.length,
    },
    summary: {
      total: results.length,
      ...summary.totals,
      byLayer: summary.byLayer,
    },
    results,
  };

  writeFileSync(RESULTS_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");

  return document;
};

const exitWith = async (code) => {
  await teardown("run finished");
  process.exit(code);
};

try {
  await main();
} catch (error) {
  out(`\n[harness] setup failed: ${error instanceof Error ? error.message : String(error)}`);
  await teardown("setup failure");
  process.exit(3);
}

const summary = printSummary();
const document = writeResults(summary);

out("");
out(`[harness] results: ${RESULTS_PATH}`);
out(`[harness] logs:    ${LOG_DIR}`);

const failedCount = summary.totals.fail + summary.totals.blocked;
out(
  failedCount === 0
    ? `[harness] ${summary.totals.pass} passed, ${summary.totals.skipped} skipped`
    : `[harness] ${failedCount} row(s) failed or blocked`,
);

if (options.json) {
  process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
}

await exitWith(failedCount === 0 ? 0 : 1);
