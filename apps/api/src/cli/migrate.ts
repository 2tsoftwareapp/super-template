import { Pool } from 'pg';

import { loadCliEnv } from './load-cli-env';
import { applySqlMigrations } from './migrations';

loadCliEnv();

const main = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for db migrate.');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    await applySqlMigrations(pool);
    console.log('Database migrations complete.');
  } catch (error) {
    if (
      error instanceof AggregateError &&
      error.errors.some(
        (cause) =>
          cause instanceof Error && cause.message.includes('ECONNREFUSED'),
      )
    ) {
      const url = new URL(databaseUrl);
      console.error(
        `Could not connect to Postgres at ${url.hostname}:${url.port || '5432'}.`,
      );
      console.error(
        'If you use docker compose, start infra with the repo .env so POSTGRES_EXPOSED_PORT matches DATABASE_URL:',
      );
      console.error(
        '  docker compose -f infra/docker-compose.yml --env-file .env up -d postgres',
      );
    }

    throw error;
  } finally {
    await pool.end();
  }
};

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
