import type { TenantContext } from "@repo/api-kernel";
import type { Server } from "node:http";

import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ThrottlerGuard } from "@nestjs/throttler";
import { TenantContextService } from "@repo/api-runtime";
import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import request from "supertest";

import { AppModule } from "../../src/app.module";
import { applySqlMigrations } from "../../src/cli/migrations";
import { seedDatabase } from "../../src/cli/seeds/seed-data";
import { acquireTestDatabaseLock } from "./test-database-lock";
import {
  ensureTestDatabaseExists,
  loadTestDatabaseEnv,
  resolveTestDatabaseAdminUrl,
  resolveTestDatabaseUrl,
  TEST_APP_ROLE_NAME,
  TEST_APP_ROLE_PASSWORD,
} from "./test-database-env";

loadTestDatabaseEnv();

export { configureTestDatabaseUrls } from "./test-database-env";

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
  // Serialise against any other e2e process before touching the shared schema: everything
  // below drops and rebuilds `public`, which would otherwise tear tables out from under a
  // concurrently running suite.
  await acquireTestDatabaseLock(adminDatabaseUrl);
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

/** Options for opting an API E2E suite into production-faithful guards. */
export interface CreateTestAppOptions {
  /** Keep the fast default unless a suite explicitly exercises throttling. */
  overrideThrottler?: boolean;
}

export const createTestApp = async (
  options: CreateTestAppOptions = {},
): Promise<INestApplication> => {
  console.log("[DEBUG] createTestApp: Test.createTestingModule");
  const testingModule = Test.createTestingModule({
    imports: [AppModule],
  });

  if (options.overrideThrottler ?? true) {
    testingModule.overrideGuard(ThrottlerGuard).useValue({
      canActivate: () => true,
    });
  }

  const moduleRef = await testingModule.compile();

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

  // Bind the HTTP server once for the whole file instead of leaving it unbound.
  //
  // Supertest only starts a server it finds unbound, and it closes that server again as
  // soon as *its* response arrives (`supertest/lib/test.js`: `if (!addr) this._server =
  // app.listen(0)` ... `if (server && server._handle) return server.close(...)`). Several
  // suites fire concurrent requests through `Promise.all`/`Promise.allSettled` on the one
  // shared server, so the request that happened to bind it would tear the listener down
  // while its siblings were still in flight. Observed as intermittent `socket hang up`
  // plus responses that could not have come from this app at all (an empty 401 body, and
  // `{"ok":false,"error":"Not found"}` - this codebase's error shape is
  // `{error:{code,message,details},meta:{...}}`), i.e. a request landing on whichever
  // process had just grabbed the freed ephemeral port. Listening here keeps one port for
  // the file's lifetime; `app.close()` in `afterAll` still shuts it down.
  await app.listen(0);
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
