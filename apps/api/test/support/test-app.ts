import type { TenantContext } from "@repo/api-kernel";
import type { Server } from "node:http";

import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { TenantContextService } from "@repo/api-runtime";
import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { loadEnvFiles } from "@repo/env-loader";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { applySqlMigrations } from "../../src/cli/migrations";
import { seedDatabase } from "../../src/cli/seeds/seed-data";

loadEnvFiles();

const TEST_APP_ROLE_NAME = "fullstack_starter_app";
const TEST_APP_ROLE_PASSWORD = "fullstack_starter_app";
const TEST_DATABASE_NAME = "fullstack_starter_test";

const buildDatabaseUrl = (role: string, password: string, database: string): string => {
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";

  return `postgresql://${encodeURIComponent(role)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

/** Keep e2e on the restricted app role even when a stale .env still points at postgres. */
export const configureTestDatabaseUrls = (): void => {
  process.env.APP_ENV = "test";

  const appTestUrl = buildDatabaseUrl(
    TEST_APP_ROLE_NAME,
    TEST_APP_ROLE_PASSWORD,
    TEST_DATABASE_NAME,
  );
  const adminTestUrl = buildDatabaseUrl(
    process.env.POSTGRES_USER ?? "postgres",
    process.env.POSTGRES_PASSWORD ?? "postgres",
    TEST_DATABASE_NAME,
  );

  const currentTestUrl = process.env.DATABASE_URL_TEST;
  const usesPrivilegedTestRole =
    !currentTestUrl ||
    /\/\/postgres[:@]/i.test(currentTestUrl) ||
    !currentTestUrl.includes(`${TEST_APP_ROLE_NAME}@`);

  if (usesPrivilegedTestRole) {
    process.env.DATABASE_URL_TEST = appTestUrl;
  }

  // Always derive the admin URL from POSTGRES_HOST/PORT instead of trusting whatever
  // is already in process.env: loadEnvFiles() falls back to .env.example for keys
  // .env doesn't set, and .env.example's DATABASE_URL_TEST_ADMIN hardcodes the
  // placeholder port 5432, which silently points migrations/reset at the wrong
  // Postgres instance whenever the real .env uses a different POSTGRES_PORT.
  process.env.DATABASE_URL_TEST_ADMIN = adminTestUrl;
};

configureTestDatabaseUrls();

const resolveTestDatabaseUrl = () => process.env.DATABASE_URL_TEST;
const resolveTestDatabaseAdminUrl = () =>
  process.env.DATABASE_URL_TEST_ADMIN ?? process.env.DATABASE_URL_TEST;

const ensureTestDatabaseExists = async (databaseUrl: string, adminDatabaseUrl: string) => {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("Test database name could not be resolved");
  }

  const adminUrl = new URL(adminDatabaseUrl);
  adminUrl.pathname = "/postgres";

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

const ensureRestrictedTestRole = async (adminDatabaseUrl: string) => {
  const pool = new Pool({
    connectionString: adminDatabaseUrl,
  });
  const databaseName = new URL(adminDatabaseUrl).pathname.replace(/^\//, "");
  const quotedDatabaseName = `"${databaseName.replace(/"/g, '""')}"`;
  const quotedRoleName = `"${TEST_APP_ROLE_NAME.replace(/"/g, '""')}"`;

  try {
    const existingRole = await pool.query<{ exists: boolean }>(
      "select exists(select 1 from pg_roles where rolname = $1) as exists",
      [TEST_APP_ROLE_NAME],
    );

    if (!existingRole.rows[0]?.exists) {
      await pool.query(`create role ${quotedRoleName} login password '${TEST_APP_ROLE_PASSWORD}'`);
    }

    await pool.query(
      `alter default privileges in schema public grant select, insert, update, delete on tables to ${quotedRoleName}`,
    );
    await pool.query(
      `alter default privileges in schema public grant usage, select, update on sequences to ${quotedRoleName}`,
    );
    await pool.query(`grant connect on database ${quotedDatabaseName} to ${quotedRoleName}`);
  } finally {
    await pool.end();
  }
};

export const resetTestDatabase = async (): Promise<void> => {
  const databaseUrl = resolveTestDatabaseUrl();
  const adminDatabaseUrl = resolveTestDatabaseAdminUrl();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL_TEST is required for tests. " +
        "Set it to a dedicated test database to avoid wiping the development database.",
    );
  }

  if (!adminDatabaseUrl) {
    throw new Error(
      "DATABASE_URL_TEST_ADMIN is required for test setup. " +
        "Set it to a privileged connection string for creating the test role and grants.",
    );
  }

  await ensureTestDatabaseExists(databaseUrl, adminDatabaseUrl);
  await ensureRestrictedTestRole(adminDatabaseUrl);

  const pool = new Pool({
    connectionString: adminDatabaseUrl,
  });

  try {
    await pool.query("drop schema if exists public cascade;");
    await pool.query("create schema public;");
    await applySqlMigrations(pool);
    await pool.query("grant usage, create on schema public to fullstack_starter_app");
    await pool.query(
      "grant select, insert, update, delete on all tables in schema public to fullstack_starter_app",
    );
    await pool.query(
      "grant usage, select, update on all sequences in schema public to fullstack_starter_app",
    );

    const verification = await pool.query<{ exists: boolean }>(
      "select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'm_organizations') as exists",
    );

    if (!verification.rows[0]?.exists) {
      throw new Error("Migrations did not create organizations table in the test database");
    }
  } finally {
    await pool.end();
  }
};

export const createTestApp = async (): Promise<INestApplication> => {
  console.log("[DEBUG] createTestApp: Test.createTestingModule");
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({
      canActivate: () => true,
    })
    .compile();

  console.log("[DEBUG] createTestApp: moduleRef.createNestApplication");
  const app = moduleRef.createNestApplication({ abortOnError: false });
  app.setGlobalPrefix("api/v1");
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

  console.log("[DEBUG] createTestApp: app.init");
  await app.init();
  console.log("[DEBUG] createTestApp: seedDatabase");
  await seedDatabase(app);
  console.log("[DEBUG] createTestApp: done");
  return app;
};

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  userId: string;
}

interface LoginResponseBody {
  data: {
    accessToken: string;
    refreshToken: string;
    session: {
      id: string;
    };
    user: {
      id: string;
    };
  };
}

export const loginAs = async (
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginResult> => {
  const httpServer = app.getHttpServer() as Server;
  const response = await request(httpServer)
    .post("/api/v1/auth/login")
    .send({
      email,
      password,
    })
    .expect(201);
  const body = response.body as LoginResponseBody;

  return {
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    sessionId: body.data.session.id,
    userId: body.data.user.id,
  };
};

export const bearer = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const getTestAppRoleName = () => TEST_APP_ROLE_NAME;

export const runWithTenantContext = async <T>(
  app: INestApplication,
  context: TenantContext,
  operation: () => Promise<T>,
): Promise<T> => {
  const tenantContextService = app.get(TenantContextService);
  // Wrap in an async callback so lazy drizzle queries execute (and thus apply
  // tenant GUCs) inside the ALS context. Returning the thenable directly lets
  // runAsync exit the context before the query actually runs.
  return tenantContextService.runAsync(context, async () => operation());
};

export const getCurrentDatabaseUser = async (app: INestApplication): Promise<string> => {
  const database = app.get<DatabaseClient>(DATABASE);
  const result = (await database.execute(
    sql<{ currentUser: string }>`select current_user as "currentUser"`,
  )) as { rows: { currentUser: string }[] };

  return result.rows[0]?.currentUser ?? "";
};
