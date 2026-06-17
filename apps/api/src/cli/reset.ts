import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { seedDatabase } from '@repo/api-bootstrap';
import { createDatabaseClient } from '@repo/api-database';
import { config as loadEnv } from 'dotenv';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { AppModule } from '../app.module';

loadEnv({
  path: resolve(process.cwd(), '.env'),
});

const main = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for db reset.');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });
  const db = createDatabaseClient(pool);

  try {
    await db.execute('drop schema public cascade;');
    await db.execute('create schema public;');
    await migrate(db, {
      migrationsFolder: resolve(__dirname, '../../drizzle'),
    });
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
