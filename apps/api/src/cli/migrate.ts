import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { Pool } from 'pg';

import { loadCliEnv } from './load-cli-env';
import { applySqlMigrations } from './migrations';
import { resolveMigrateDatabaseUrl } from './resolve-migrate-database-url';

const printPostgresConnectionHint = (databaseUrl: string): void => {
  const hintScript = resolve(
    __dirname,
    '../../../../scripts/postgres-connection-hint.mjs',
  );
  spawnSync(process.execPath, [hintScript, databaseUrl], {
    env: process.env,
    stdio: 'inherit',
  });
};

const isConnectionRefused = (error: unknown): boolean => {
  if (!(error instanceof AggregateError)) {
    return false;
  }

  return error.errors.some(
    (cause) => cause instanceof Error && cause.message.includes('ECONNREFUSED'),
  );
};

loadCliEnv();

const main = async (): Promise<void> => {
  const databaseUrl = resolveMigrateDatabaseUrl();

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    await applySqlMigrations(pool);
    console.log('Database migrations complete.');
  } catch (error) {
    if (isConnectionRefused(error)) {
      printPostgresConnectionHint(databaseUrl);
      process.exitCode = 1;
      return;
    }

    throw error;
  } finally {
    await pool.end();
  }
};

void main().catch((error) => {
  if (process.exitCode === 1) {
    return;
  }

  console.error(error);
  process.exitCode = 1;
});
