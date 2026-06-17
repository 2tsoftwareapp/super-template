import { NestFactory } from '@nestjs/core';
import { seedDatabase } from '@repo/api-bootstrap';
import { createDatabaseClient } from '@repo/api-database';
import { Pool } from 'pg';

import { AppModule } from '../app.module';
import { loadCliEnv } from './load-cli-env';
import { applySqlMigrations } from './migrations';
import { resolveMigrateDatabaseUrl } from './resolve-migrate-database-url';

loadCliEnv();

const main = async (): Promise<void> => {
  const databaseUrl = resolveMigrateDatabaseUrl();

  const pool = new Pool({
    connectionString: databaseUrl,
  });
  const db = createDatabaseClient(pool);

  try {
    await db.execute('drop schema public cascade;');
    await db.execute('create schema public;');
    await applySqlMigrations(pool);
  } finally {
    await pool.end();
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    await seedDatabase(app);
  } finally {
    await app.close();
  }
};

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
