/**
 * Port preflight helpers: resolve env ports, classify listener state, and check URL sync.
 */
import { connect } from 'node:net';
import { execSync } from 'node:child_process';
import { repoRoot } from './merge-env.mjs';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export const parseDatabaseUrlPort = (urlString, fallback = 5432) => {
  if (!urlString?.trim()) {
    return null;
  }

  try {
    const url = new URL(urlString.replace(/^postgres(ql)?:\/\//, 'http://'));
    const port = url.port ? Number(url.port) : fallback;
    return Number.isFinite(port) ? port : null;
  } catch {
    return null;
  }
};

export const parseDatabaseUrlHost = (urlString, fallback = 'localhost') => {
  if (!urlString?.trim()) {
    return fallback;
  }

  try {
    const url = new URL(urlString.replace(/^postgres(ql)?:\/\//, 'http://'));
    return url.hostname || fallback;
  } catch {
    return fallback;
  }
};

export const resolvePostgresExposedPort = (env) =>
  Number(
    env.POSTGRES_EXPOSED_PORT ?? env.POSTGRES_PORT ?? 5432,
  );

export const isLocalHost = (host) => LOCAL_HOSTS.has(host);

export const portAcceptsConnection = (host, port, timeoutMs = 1000) =>
  new Promise((resolveReady) => {
    const socket = connect({ host, port });
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.end();
      resolveReady(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolveReady(false);
    });
    socket.once('error', () => resolveReady(false));
  });

export const isComposePostgresRunning = (root = repoRoot) => {
  try {
    const output = execSync(
      'docker compose -f infra/docker-compose.yml ps --services --filter status=running',
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return output.includes('postgres');
  } catch {
    return false;
  }
};

/** Host port mapped to the compose postgres service, or null if unavailable. */
export const getComposePostgresHostPort = (root = repoRoot) => {
  try {
    const mapped = execSync(
      'docker compose -f infra/docker-compose.yml port postgres 5432',
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    const match = mapped.match(/:(\d+)$/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
};

/**
 * @returns {'free' | 'ours' | 'foreign' | 'remote'}
 */
export const classifyPostgresPortState = async (
  host,
  port,
  root = repoRoot,
) => {
  if (!isLocalHost(host)) {
    return 'remote';
  }

  const listening = await portAcceptsConnection(host, port);
  if (!listening) {
    return 'free';
  }

  if (!isComposePostgresRunning(root)) {
    return 'foreign';
  }

  const ourPort = getComposePostgresHostPort(root);
  if (ourPort === port) {
    return 'ours';
  }

  return 'foreign';
};

const POSTGRES_URL_KEYS = [
  ['DATABASE_URL', 'DATABASE_URL'],
  ['DATABASE_MIGRATE_URL', 'DATABASE_MIGRATE_URL'],
  ['DATABASE_URL_TEST', 'DATABASE_URL_TEST'],
  ['DATABASE_URL_TEST_ADMIN', 'DATABASE_URL_TEST_ADMIN'],
];

export const checkPostgresUrlPortSync = (env) => {
  const exposedPort = resolvePostgresExposedPort(env);
  const postgresPort = env.POSTGRES_PORT?.trim()
    ? Number(env.POSTGRES_PORT)
    : null;
  const errors = [];
  const warnings = [];

  if (postgresPort !== null && postgresPort !== exposedPort) {
    warnings.push(
      `POSTGRES_PORT (${postgresPort}) differs from POSTGRES_EXPOSED_PORT (${exposedPort}) — scripts may disagree on the host port`,
    );
  }

  for (const [label, key] of POSTGRES_URL_KEYS) {
    const value = env[key]?.trim();
    if (!value) {
      continue;
    }

    const urlPort = parseDatabaseUrlPort(value, exposedPort);
    if (urlPort === null) {
      warnings.push(`${label} could not be parsed for port comparison`);
      continue;
    }

    if (urlPort !== exposedPort) {
      errors.push(
        `${label} uses port ${urlPort} but POSTGRES_EXPOSED_PORT is ${exposedPort}`,
      );
    }
  }

  return { errors, warnings, exposedPort };
};

export const formatPortStateLabel = (state) => {
  switch (state) {
    case 'free':
      return 'FREE (not listening)';
    case 'ours':
      return 'OURS (super-template-postgres)';
    case 'foreign':
      return 'FOREIGN (another process)';
    case 'remote':
      return 'REMOTE (non-local host)';
    default:
      return state;
  }
};

export const suggestPostgresAction = (state) => {
  switch (state) {
    case 'free':
      return 'start postgres: docker compose -f infra/docker-compose.yml --env-file .env up -d postgres (or pnpm bootstrap / make dev)';
    case 'ours':
      return 'reuse running container; if migrate still fails, check credentials and DATABASE_MIGRATE_URL';
    case 'foreign':
      return 'pick another POSTGRES_EXPOSED_PORT in .env.local and sync all DATABASE_* URLs to the same port';
    case 'remote':
      return 'ensure the remote Postgres host is reachable and credentials are correct';
    default:
      return '';
  }
};

export const buildPostgresPreflightRows = async (env, root = repoRoot) => {
  const exposedPort = resolvePostgresExposedPort(env);
  const host =
    env.POSTGRES_HOST?.trim() ||
    parseDatabaseUrlHost(env.DATABASE_MIGRATE_URL ?? env.DATABASE_URL);
  const migratePort =
    parseDatabaseUrlPort(
      env.DATABASE_MIGRATE_URL ?? env.DATABASE_URL,
      exposedPort,
    ) ?? exposedPort;
  const migrateState = await classifyPostgresPortState(host, migratePort, root);
  const exposedState =
    migratePort === exposedPort
      ? migrateState
      : await classifyPostgresPortState(host, exposedPort, root);
  const sync = checkPostgresUrlPortSync(env);

  return {
    host,
    migratePort,
    exposedPort,
    migrateState,
    exposedState,
    state: migrateState,
    sync,
    action: suggestPostgresAction(migrateState),
    exposedAction:
      migratePort === exposedPort ? null : suggestPostgresAction(exposedState),
  };
};

export const printPostgresConnectionHint = async (
  databaseUrl,
  env = process.env,
  root = repoRoot,
) => {
  const host = parseDatabaseUrlHost(databaseUrl);
  const port = parseDatabaseUrlPort(databaseUrl) ?? 5432;
  const exposedPort = resolvePostgresExposedPort(env);
  const state = await classifyPostgresPortState(host, port, root);
  const exposedState =
    port === exposedPort
      ? state
      : await classifyPostgresPortState(host, exposedPort, root);
  const sync = checkPostgresUrlPortSync(env);

  console.error(`Could not connect to Postgres at ${host}:${port}.`);
  console.error(`Port state: ${formatPortStateLabel(state)}.`);

  if (port !== exposedPort) {
    console.error(
      `POSTGRES_EXPOSED_PORT is ${exposedPort} → ${formatPortStateLabel(exposedState)}.`,
    );
  }

  for (const message of sync.errors) {
    console.error(`Config mismatch: ${message}.`);
  }

  if (
    state === 'free' &&
    port !== exposedPort &&
    exposedState === 'ours'
  ) {
    console.error(
      `PostgreSQL is running on ${host}:${exposedPort} but your DATABASE_* URLs still use port ${port}.`,
    );
    console.error(
      `Update DATABASE_URL, DATABASE_MIGRATE_URL, and test URLs to port ${exposedPort}, or set POSTGRES_EXPOSED_PORT back to ${port}.`,
    );
  } else if (state === 'free') {
    console.error('PostgreSQL is not running on that host port.');
    console.error('Start infra with:');
    console.error(
      '  docker compose -f infra/docker-compose.yml --env-file .env up -d postgres',
    );
    console.error('Or run a full local setup: pnpm bootstrap / make dev');
  } else if (state === 'foreign') {
    console.error(
      'Another process is listening on that port (not super-template-postgres).',
    );
    console.error(
      'Override POSTGRES_EXPOSED_PORT in .env.local and update DATABASE_URL, DATABASE_MIGRATE_URL, and test URLs to match.',
    );
  } else if (state === 'ours') {
    console.error(
      'super-template-postgres is running but the connection was refused or rejected.',
    );
    console.error(
      'Check DATABASE_MIGRATE_URL credentials, or wait a few seconds and retry.',
    );
  } else {
    console.error(suggestPostgresAction(state));
  }

  if (sync.errors.length > 0) {
    console.error(
      'Fix port mismatches between POSTGRES_EXPOSED_PORT and DATABASE_* URLs before retrying.',
    );
  }
};
