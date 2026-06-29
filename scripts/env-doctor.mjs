#!/usr/bin/env node
/**
 * Validates local toolchain and layered env files for the active APP_ENV.
 */
import { connect } from 'node:net';
import { execSync } from 'node:child_process';
import { mergeEnvFiles, repoRoot } from './merge-env.mjs';
import {
  buildPostgresPreflightRows,
  checkPostgresUrlPortSync,
  formatPortStateLabel,
} from './port-preflight.mjs';

const root = repoRoot;
const appEnv = process.env.APP_ENV?.trim() || 'development';

const semverGte = (left, right) => {
  const parse = (value) => value.replace(/^v/, '').split('.').map(Number);
  const [lMajor, lMinor = 0, lPatch = 0] = parse(left);
  const [rMajor, rMinor = 0, rPatch = 0] = parse(right);
  if (lMajor !== rMajor) return lMajor > rMajor;
  if (lMinor !== rMinor) return lMinor > rMinor;
  return lPatch >= rPatch;
};

const warnings = [];
const errors = [];

const runVersionCheck = (commands, minVersion, label) => {
  for (const command of commands) {
    try {
      const raw = execSync(command, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        shell: true,
      }).trim();
      const version = raw.match(/\d+\.\d+\.\d+/)?.[0];
      if (minVersion && version && !semverGte(version, minVersion)) {
        warnings.push(`${label} ${version} found; ${minVersion}+ recommended`);
      }
      return true;
    } catch {
      // try next command variant
    }
  }

  errors.push(`Missing required tool: ${label}${minVersion ? ` (${minVersion}+)` : ''}`);
  return false;
};

runVersionCheck(['node --version'], '24.14.0', 'node');
runVersionCheck(['pnpm --version', 'corepack pnpm --version'], '11.7.0', 'pnpm');
runVersionCheck(['docker --version'], null, 'docker');

try {
  execSync('docker info', { stdio: 'ignore' });
} catch {
  errors.push('Docker daemon is not running');
}

const { merged, loadedFiles } = mergeEnvFiles(root, appEnv);

console.log(`APP_ENV=${appEnv}`);
console.log(`Loaded env files: ${loadedFiles.join(', ') || '(none)'}`);

const requiredKeys = [
  'DATABASE_URL',
  'API_INTERNAL_URL',
  'WEB_ORIGIN',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'MFA_ENCRYPTION_KEY',
];

for (const key of requiredKeys) {
  if (!merged[key]?.trim()) {
    errors.push(`Missing ${key} after env layering`);
  }
}

if (appEnv === 'staging' || appEnv === 'production') {
  const envFile = `${root}/.env.${appEnv}`;
  if (!loadedFiles.includes(`.env.${appEnv}`)) {
    errors.push(
      `Create .env.${appEnv} from .env.${appEnv}.example before running ${appEnv}`,
    );
  }

  const placeholders = new Set([
    'replace-with-a-long-random-development-secret',
    'replace-with-another-long-random-development-secret',
    '0861abb090792515d50d973600fced671ad99f2edd463d5da88887d90d594f99',
  ]);

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MFA_ENCRYPTION_KEY']) {
    if (placeholders.has(merged[key])) {
      errors.push(`${key} still uses the development placeholder in ${appEnv}`);
    }
  }
}

const isComposeInfraRunning = () => {
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

const postgresSync = checkPostgresUrlPortSync(merged);
for (const message of postgresSync.warnings) {
  warnings.push(message);
}
for (const message of postgresSync.errors) {
  errors.push(message);
}

const postgresPreflight = await buildPostgresPreflightRows(merged, root);
console.log(
  `[env:doctor] Postgres migrate target ${postgresPreflight.host}:${postgresPreflight.migratePort} → ${formatPortStateLabel(postgresPreflight.migrateState)}`,
);
if (postgresPreflight.migratePort !== postgresPreflight.exposedPort) {
  console.log(
    `[env:doctor] POSTGRES_EXPOSED_PORT ${postgresPreflight.host}:${postgresPreflight.exposedPort} → ${formatPortStateLabel(postgresPreflight.exposedState)}`,
  );
}
if (postgresPreflight.action) {
  const action =
    postgresPreflight.migrateState === 'free' &&
    postgresPreflight.exposedState === 'ours' &&
    postgresPreflight.migratePort !== postgresPreflight.exposedPort
      ? `sync DATABASE_* URLs to port ${postgresPreflight.exposedPort} (Postgres is already running there)`
      : postgresPreflight.action;
  console.log(`[env:doctor] Suggested action: ${action}`);
}
if (postgresPreflight.exposedAction) {
  console.log(
    `[env:doctor] Exposed port action: ${postgresPreflight.exposedAction}`,
  );
}

const portInUse = (port) =>
  new Promise((resolvePort) => {
    const socket = connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.end();
      resolvePort(true);
    });
    socket.once('error', () => resolvePort(false));
  });

const infraRunning = isComposeInfraRunning();

for (const [label, key, fallback] of [
  ['Postgres', 'POSTGRES_EXPOSED_PORT', 5432],
  ['Redis', 'REDIS_PORT', 6379],
  ['Mailpit UI', 'MAILPIT_HTTP_PORT', 8025],
]) {
  const port = Number(merged[key] ?? fallback);
  if (!infraRunning && (await portInUse(port))) {
    warnings.push(
      `${label} port ${port} is already in use — override ${key} in .env.local or stop the conflicting service`,
    );
  }
}

if (infraRunning) {
  console.log('[env:doctor] Docker infra is running (Postgres/Redis/Mailpit ports in use is expected).');
}

if (!merged.REDIS_URL?.trim()) {
  warnings.push(
    'REDIS_URL is empty — OK for single-instance dev; optional Redis improves throttling/SSE fan-out',
  );
}

try {
  execSync('sh scripts/mobile.sh doctor', { cwd: root, stdio: 'ignore' });
} catch {
  warnings.push('Flutter not available — mobile commands will be skipped');
}

for (const message of warnings) {
  console.warn(`[env:doctor] warning: ${message}`);
}

for (const message of errors) {
  console.error(`[env:doctor] error: ${message}`);
}

if (errors.length > 0) {
  process.exit(1);
}

console.log('[env:doctor] Environment looks ready for local development.');
