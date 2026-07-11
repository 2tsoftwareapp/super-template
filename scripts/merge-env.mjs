import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

export const repoRoot = resolve(import.meta.dirname, '..');

export const parseEnvFile = (filePath) => {
  if (!existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
};

/**
 * Merges layered env files using the same effective precedence as load-env.sh
 * (last file wins). Matches what Node apps resolve after @repo/env-loader runs.
 */
export const mergeEnvFiles = (
  root = repoRoot,
  appEnv = process.env.APP_ENV?.trim() || 'development',
) => {
  const layers = [
    '.env.example',
    '.env',
    `.env.${appEnv}`,
    appEnv === 'test' ? null : '.env.local',
    `.env.${appEnv}.local`,
  ].filter(Boolean);

  const merged = {};
  const loadedFiles = [];

  for (const file of layers) {
    const filePath = resolve(root, file);
    if (!existsSync(filePath)) {
      continue;
    }
    loadedFiles.push(file);
    Object.assign(merged, parseEnvFile(filePath));
  }

  // Helper to check if a port is listening locally
  const isPortInUseSync = (port) => {
    try {
      execSync(
        `"${process.execPath}" -e "const s = require('net').createServer(); s.once('error', () => process.exit(1)); s.listen(${port}, () => { s.close(); process.exit(0); })"`,
        { stdio: 'ignore' }
      );
      return false;
    } catch {
      return true;
    }
  };

  // Helper to check if docker-compose service is running
  const isComposeServiceRunning = (serviceName) => {
    try {
      const output = execSync(
        'docker compose -f infra/docker-compose.yml ps --services --filter status=running',
        { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      );
      return output.includes(serviceName);
    } catch {
      return false;
    }
  };

  // Helper to get docker-compose service port mapping
  const getComposeServiceHostPort = (serviceName, containerPort) => {
    try {
      const mapped = execSync(
        `docker compose -f infra/docker-compose.yml port ${serviceName} ${containerPort}`,
        { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      ).trim();
      const match = mapped.match(/:(\d+)$/);
      return match ? Number(match[1]) : null;
    } catch {
      return null;
    }
  };

  // Helper to resolve dynamic port for a service
  const resolveServicePort = (serviceName, containerPort, defaultPort) => {
    if (isComposeServiceRunning(serviceName)) {
      const ourPort = getComposeServiceHostPort(serviceName, containerPort);
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

  const updateUrlPort = (urlString, newPort) => {
    if (!urlString) return urlString;
    try {
      const url = new URL(urlString);
      url.port = newPort.toString();
      return url.toString();
    } catch {
      // Fallback regex replacement if URL parsing fails
      return urlString.replace(/:(\d+)(\/|$)/, `:${newPort}$2`);
    }
  };

  // Resolve POSTGRES_EXPOSED_PORT and update DATABASE_URL variants
  let postgresPort = merged.POSTGRES_EXPOSED_PORT ? Number(merged.POSTGRES_EXPOSED_PORT) : 5432;
  if (merged.POSTGRES_PORT) {
    postgresPort = Number(merged.POSTGRES_PORT);
  }
  const dbUrls = [
    merged.DATABASE_MIGRATE_URL,
    merged.DATABASE_URL,
    merged.DATABASE_URL_TEST,
    merged.DATABASE_URL_TEST_ADMIN,
  ];
  for (const urlStr of dbUrls) {
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

  const resolvedPostgresPort = resolveServicePort('postgres', 5432, postgresPort);
  merged.POSTGRES_EXPOSED_PORT = resolvedPostgresPort.toString();
  if (merged.POSTGRES_PORT) {
    merged.POSTGRES_PORT = resolvedPostgresPort.toString();
  }
  if (merged.DATABASE_URL) {
    merged.DATABASE_URL = updateUrlPort(merged.DATABASE_URL, resolvedPostgresPort);
  }
  if (merged.DATABASE_MIGRATE_URL) {
    merged.DATABASE_MIGRATE_URL = updateUrlPort(merged.DATABASE_MIGRATE_URL, resolvedPostgresPort);
  }
  if (merged.DATABASE_URL_TEST) {
    merged.DATABASE_URL_TEST = updateUrlPort(merged.DATABASE_URL_TEST, resolvedPostgresPort);
  }
  if (merged.DATABASE_URL_TEST_ADMIN) {
    merged.DATABASE_URL_TEST_ADMIN = updateUrlPort(merged.DATABASE_URL_TEST_ADMIN, resolvedPostgresPort);
  }

  // Resolve REDIS_PORT and update REDIS_URL dynamically if needed
  let redisPort = merged.REDIS_PORT ? Number(merged.REDIS_PORT) : 6379;
  let redisUrl = merged.REDIS_URL;

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

  const resolvedRedisPort = resolveServicePort('redis', 6379, redisPort);
  merged.REDIS_PORT = resolvedRedisPort.toString();
  if (redisUrl) {
    merged.REDIS_URL = updateUrlPort(redisUrl, resolvedRedisPort);
  }

  // Resolve MAIL_PORT for Mailpit SMTP
  let mailPort = merged.MAIL_PORT ? Number(merged.MAIL_PORT) : 1025;
  const resolvedMailPort = resolveServicePort('mailpit', 1025, mailPort);
  merged.MAIL_PORT = resolvedMailPort.toString();

  // Resolve MAILPIT_HTTP_PORT for Mailpit HTTP
  let mailpitHttpPort = merged.MAILPIT_HTTP_PORT ? Number(merged.MAILPIT_HTTP_PORT) : 8025;
  const resolvedMailpitHttpPort = resolveServicePort('mailpit', 8025, mailpitHttpPort);
  merged.MAILPIT_HTTP_PORT = resolvedMailpitHttpPort.toString();

  return { merged, loadedFiles, appEnv };
};
