import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { Pool } from 'pg';

import { applySqlMigrations } from './migrations';

loadEnv({
  path: resolve(process.cwd(), '.env'),
});

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
  } finally {
    await pool.end();
  }
};

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
