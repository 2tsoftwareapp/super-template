import { config as loadEnv } from "dotenv";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const WORKSPACE_MARKER = "pnpm-workspace.yaml";

/** Walks up from [start] to find the monorepo root (folder with pnpm-workspace.yaml). */
const findRepoRoot = (start: string): string => {
  let current = start;
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(resolve(current, WORKSPACE_MARKER))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return start;
};

/**
 * Absolute path of the monorepo root, or [start] (default `process.cwd()`) when no
 * workspace marker is found — a packaged or deployed app keeps plain cwd semantics.
 *
 * Callers need this to turn a *relative* configured path into a location every host in
 * the workspace agrees on: pnpm runs each package script with that package's cwd, so
 * `./storage` means `apps/api/storage` for the API but `apps/worker/storage` for the
 * worker. Anchoring to the workspace root keeps shared on-disk state actually shared.
 */
export const resolveWorkspaceRoot = (start: string = process.cwd()): string => findRepoRoot(start);

export type AppEnvName = "development" | "test" | "staging" | "production";

export interface LoadEnvOptions {
  /** Override APP_ENV detection (defaults to process.env.APP_ENV or 'development'). */
  appEnv?: string;
  /** Directory to resolve env files from (defaults to process.cwd()). */
  cwd?: string;
  /**
   * Pin the Postgres host port: skip the free-port scan entirely and rewrite
   * DATABASE_* URLs to this port. For CI / hosted environments where the
   * service is already live at a known port.
   */
  pinnedPostgresPort?: number;
}

const isPortInUseSync = (port: number): boolean => {
  try {
    execSync(
      `"${process.execPath}" -e "const s = require('net').createServer(); s.once('error', () => process.exit(1)); s.listen(${port}, () => { s.close(); process.exit(0); })"`,
      { stdio: "ignore" },
    );
    return false;
  } catch {
    return true;
  }
};

const isComposeServiceRunning = (root: string, serviceName: string): boolean => {
  try {
    const output = execSync(
      "docker compose -f infra/docker-compose.yml ps --services --filter status=running",
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    return output.includes(serviceName);
  } catch {
    return false;
  }
};

const getComposeServiceHostPort = (
  root: string,
  serviceName: string,
  containerPort: number,
): number | null => {
  try {
    const mapped = execSync(
      `docker compose -f infra/docker-compose.yml port ${serviceName} ${containerPort}`,
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    const match = /:(\d+)$/.exec(mapped);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
};

const resolveServicePort = (
  root: string,
  serviceName: string,
  containerPort: number,
  defaultPort: number,
  pinnedPort?: number,
): number => {
  // Operator pinned the port via real environment (e.g. CI with a live
  // service): trust it and never scan past a listening instance.
  if (pinnedPort !== undefined) {
    return pinnedPort;
  }
  if (isComposeServiceRunning(root, serviceName)) {
    const ourPort = getComposeServiceHostPort(root, serviceName, containerPort);
    if (ourPort) {
      return ourPort;
    }
  }
  let port = defaultPort;
  let attempts = 0;
  while (isPortInUseSync(port) && attempts < 100) {
    port++;
    attempts++;
  }
  return port;
};

const updateUrlPort = (urlString: string | undefined, newPort: number): string | undefined => {
  if (!urlString) return urlString;
  try {
    const url = new URL(urlString);
    url.port = newPort.toString();
    return url.toString();
  } catch {
    return urlString.replace(/:(\d+)(\/|$)/, `:${newPort}$2`);
  }
};

const resolveDynamicPorts = (root: string, pinnedPostgresPort?: number): void => {
  // 1. Postgres
  let postgresPort = process.env.POSTGRES_EXPOSED_PORT
    ? Number(process.env.POSTGRES_EXPOSED_PORT)
    : 5432;
  if (process.env.POSTGRES_PORT) {
    postgresPort = Number(process.env.POSTGRES_PORT);
  }
  // Replica URLs are independently managed endpoints. They may use a
  // different host and port, so they are intentionally excluded from primary
  // dynamic-port discovery and rewriting. Local replica resolution must be an
  // explicit future option rather than an implicit topology mutation.
  const primaryDbUrls = [
    process.env.DATABASE_MIGRATE_URL,
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_TEST,
    process.env.DATABASE_URL_TEST_ADMIN,
  ];
  for (const urlStr of primaryDbUrls) {
    if (urlStr) {
      try {
        const url = new URL(urlStr);
        if (url.port) {
          postgresPort = Number(url.port);
          break;
        }
      } catch {
        // ignore
      }
    }
  }

  const resolvedPostgresPort =
    pinnedPostgresPort ?? resolveServicePort(root, "postgres", 5432, postgresPort);
  process.env.POSTGRES_EXPOSED_PORT = resolvedPostgresPort.toString();
  if (process.env.POSTGRES_PORT) {
    process.env.POSTGRES_PORT = resolvedPostgresPort.toString();
  }
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = updateUrlPort(process.env.DATABASE_URL, resolvedPostgresPort);
  }
  if (process.env.DATABASE_MIGRATE_URL) {
    process.env.DATABASE_MIGRATE_URL = updateUrlPort(
      process.env.DATABASE_MIGRATE_URL,
      resolvedPostgresPort,
    );
  }
  if (process.env.DATABASE_URL_TEST) {
    process.env.DATABASE_URL_TEST = updateUrlPort(
      process.env.DATABASE_URL_TEST,
      resolvedPostgresPort,
    );
  }
  if (process.env.DATABASE_URL_TEST_ADMIN) {
    process.env.DATABASE_URL_TEST_ADMIN = updateUrlPort(
      process.env.DATABASE_URL_TEST_ADMIN,
      resolvedPostgresPort,
    );
  }

  // 2. Redis
  let redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      if (url.port) {
        redisPort = Number(url.port);
      }
    } catch {
      // ignore
    }
  }

  const resolvedRedisPort = resolveServicePort(root, "redis", 6379, redisPort);
  process.env.REDIS_PORT = resolvedRedisPort.toString();
  if (redisUrl) {
    process.env.REDIS_URL = updateUrlPort(redisUrl, resolvedRedisPort);
  }

  // 3. Mailpit SMTP
  const mailPort = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 1025;
  const resolvedMailPort = resolveServicePort(root, "mailpit", 1025, mailPort);
  process.env.MAIL_PORT = resolvedMailPort.toString();

  // 4. Mailpit HTTP
  const mailpitHttpPort = process.env.MAILPIT_HTTP_PORT
    ? Number(process.env.MAILPIT_HTTP_PORT)
    : 8025;
  const resolvedMailpitHttpPort = resolveServicePort(root, "mailpit", 8025, mailpitHttpPort);
  process.env.MAILPIT_HTTP_PORT = resolvedMailpitHttpPort.toString();
};

/**
 * Resolves the active APP_ENV from the real process env (or an explicit override),
 * defaulting to 'development'. APP_ENV is intentionally never read from the env-file
 * cascade to avoid a chicken-and-egg problem.
 */
export const resolveAppEnv = (explicit?: string): string => {
  const value = explicit ?? process.env.APP_ENV;
  return value && value.length > 0 ? value : "development";
};

/**
 * Loads layered env files into process.env. dotenv never overrides a key that is
 * already set, so the first file to define a key wins. Files are applied from
 * highest to lowest precedence:
 *
 *   1. real process env (already set — always wins)
 *   2. .env.<APP_ENV>.local   personal per-env overrides       [gitignored]
 *   3. .env.local             personal overrides (dev only)    [gitignored, skipped outside APP_ENV=development]
 *   4. .env.<APP_ENV>         committed non-secret defaults
 *   5. .env                   legacy local catch-all           [gitignored]
 *   6. .env.example           documented fallback
 *
 * Both the current working directory and the repo root are searched for each file
 * so the loader works whether the process starts at the monorepo root or inside an app.
 *
 * @returns the resolved APP_ENV.
 */
export const loadEnvFiles = (options: LoadEnvOptions = {}): string => {
  const cwd = options.cwd ?? process.cwd();
  const appEnv = resolveAppEnv(options.appEnv);
  const root = findRepoRoot(cwd);

  // Snapshot real-environment pin BEFORE file loading: a POSTGRES_EXPOSED_PORT
  // set by the operator/CI pins the port; file-only values still get scanned.
  const realEnvPinnedPostgresPort = process.env.POSTGRES_EXPOSED_PORT
    ? Number(process.env.POSTGRES_EXPOSED_PORT)
    : undefined;

  const files = [
    `.env.${appEnv}.local`,
    appEnv === "development" ? ".env.local" : null,
    `.env.${appEnv}`,
    ".env",
    ".env.example",
  ].filter((name): name is string => name !== null);

  const roots = cwd === root ? [cwd] : [cwd, root];

  for (const file of files) {
    for (const dir of roots) {
      loadEnv({ path: resolve(dir, file), quiet: true });
    }
  }

  resolveDynamicPorts(root, options.pinnedPostgresPort ?? realEnvPinnedPostgresPort);

  process.env.APP_ENV ??= appEnv;

  return appEnv;
};
