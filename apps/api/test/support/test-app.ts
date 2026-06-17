import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { seedDatabase } from '@repo/api-bootstrap';
import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

loadEnv({ path: resolve(process.cwd(), '.env'), quiet: true });
loadEnv({ path: resolve(process.cwd(), '../../.env'), quiet: true });

process.env.APP_ENV = 'test';

const resolveTestDatabaseUrl = () => process.env.DATABASE_URL_TEST;

const resolveMigrationsFolder = () => {
  const candidates = [
    resolve(process.cwd(), 'drizzle'),
    resolve(process.cwd(), 'apps/api/drizzle'),
  ];

  const folder = candidates.find((candidate) =>
    existsSync(resolve(candidate, 'meta/_journal.json')),
  );

  if (!folder) {
    throw new Error('Could not resolve the Drizzle migrations folder');
  }

  return folder;
};

const applySqlMigrations = async (pool: Pool) => {
  const migrationsFolder = resolveMigrationsFolder();
  const migrationFiles = readdirSync(migrationsFolder)
    .filter((file) => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  for (const migrationFile of migrationFiles) {
    const sql = readFileSync(resolve(migrationsFolder, migrationFile), 'utf8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await pool.query(statement);
    }
  }
};

const ensureTestDatabaseExists = async (databaseUrl: string) => {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\//, '');

  if (!databaseName) {
    throw new Error('Test database name could not be resolved');
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  const adminPool = new Pool({
    connectionString: adminUrl.toString(),
  });

  try {
    const result = await adminPool.query<{ exists: boolean }>(
      'select exists(select 1 from pg_database where datname = $1) as "exists"',
      [databaseName],
    );

    if (!result.rows[0]?.exists) {
      const safeDatabaseName = `"${databaseName.replace(/"/g, '""')}"`;
      await adminPool.query(`create database ${safeDatabaseName}`);
    }
  } finally {
    await adminPool.end();
  }
};

export const resetTestDatabase = async (): Promise<void> => {
  const databaseUrl = resolveTestDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL_TEST is required for tests. ' +
        'Set it to a dedicated test database to avoid wiping the development database.',
    );
  }

  await ensureTestDatabaseExists(databaseUrl);

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    await pool.query('drop schema if exists public cascade;');
    await pool.query('create schema public;');
    await applySqlMigrations(pool);

    const verification = await pool.query<{ exists: boolean }>(
      "select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'organizations') as exists",
    );

    if (!verification.rows[0]?.exists) {
      throw new Error(
        'Migrations did not create organizations table in the test database',
      );
    }
  } finally {
    await pool.end();
  }

  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    await seedDatabase(context);
  } finally {
    await context.close();
  }
};

export const createTestApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({
      canActivate: () => true,
    })
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  return app;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  userId: string;
};

export const loginAs = async (
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginResult> => {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      email,
      password,
    })
    .expect(201);

  return {
    accessToken: response.body.data.accessToken,
    refreshToken: response.body.data.refreshToken,
    sessionId: response.body.data.session.id,
    userId: response.body.data.user.id,
  };
};

export const bearer = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
