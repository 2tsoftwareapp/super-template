import type { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WORKER_DISPATCH_CONTEXT } from "@repo/api-kernel";
import { TenantContextService } from "@repo/api-runtime";
import { type DatabaseClient, DATABASE, withTenantContext } from "@repo/database-runtime";
import { loadEnvFiles } from "@repo/env-loader";
import { JobsRepository, JobsService } from "@repo/feature-jobs/module";
import { jobEvents } from "@repo/feature-jobs/schema";
import { organizationMembers } from "@repo/feature-organizations/schema";
import {
  NotificationJobsRepository,
  NotificationsService,
} from "@repo/feature-notifications/module";
import {
  notificationDeliveries,
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from "@repo/feature-notifications/schema";
import { users } from "@repo/feature-users/schema";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { Pool } from "pg";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { WorkerModule } from "../src/worker.module";

interface WorkerTenant {
  organizationId: string;
  userId: string;
}

const testRole = "fullstack_starter_app";
const testRolePassword = "fullstack_starter_app";
const testDatabase = "fullstack_starter_test";
const workerE2eEnabled = process.env.WORKER_E2E === "1";

const quoteIdentifier = (value: string): string => `"${value.replaceAll('"', '""')}"`;
const quoteLiteral = (value: string): string => `'${value.replaceAll("'", "''")}'`;

const buildDatabaseUrl = (role: string, password: string): string => {
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  return `postgresql://${encodeURIComponent(role)}:${encodeURIComponent(password)}@${host}:${port}/${testDatabase}`;
};

/**
 * Reset the dedicated test database through the existing API migration/seed
 * commands, then run the real worker against the seeded restricted role.
 */
const resetWorkerDatabase = async (): Promise<void> => {
  process.env.APP_ENV = "test";
  loadEnvFiles({ appEnv: "test" });
  const appUrl = buildDatabaseUrl(testRole, testRolePassword);
  const adminUrl = buildDatabaseUrl(
    process.env.POSTGRES_USER ?? "postgres",
    process.env.POSTGRES_PASSWORD ?? "postgres",
  );
  const adminRoot = new URL(adminUrl);
  adminRoot.pathname = "/postgres";

  const rootPool = new Pool({ connectionString: adminRoot.toString() });
  try {
    const existingDatabase = await rootPool.query<{ exists: boolean }>(
      "select exists(select 1 from pg_database where datname = $1) as exists",
      [testDatabase],
    );
    if (!existingDatabase.rows[0]?.exists) {
      await rootPool.query(`create database ${quoteIdentifier(testDatabase)}`);
    }

    const existingRole = await rootPool.query<{ exists: boolean }>(
      "select exists(select 1 from pg_roles where rolname = $1) as exists",
      [testRole],
    );
    const roleSql = existingRole.rows[0]?.exists ? "alter role" : "create role";
    await rootPool.query(
      `${roleSql} ${quoteIdentifier(testRole)} with login password ${quoteLiteral(testRolePassword)}`,
    );
    await rootPool.query(
      `grant connect on database ${quoteIdentifier(testDatabase)} to ${quoteIdentifier(testRole)}`,
    );
  } finally {
    await rootPool.end();
  }

  const adminPool = new Pool({ connectionString: adminUrl });
  try {
    await adminPool.query("drop schema if exists public cascade");
    await adminPool.query("create schema public");
  } finally {
    await adminPool.end();
  }

  const commandEnv = {
    ...process.env,
    APP_ENV: "test",
    DATABASE_MIGRATE_URL: adminUrl,
    DATABASE_URL_TEST: appUrl,
    DATABASE_URL_TEST_ADMIN: adminUrl,
  };
  const repoRoot = resolve(process.cwd(), "../..");
  execFileSync("pnpm", ["--filter", "api", "db:migrate"], {
    cwd: repoRoot,
    env: commandEnv,
    stdio: "inherit",
  });

  const grantPool = new Pool({ connectionString: adminUrl });
  try {
    await grantPool.query(`grant usage, create on schema public to ${quoteIdentifier(testRole)}`);
    await grantPool.query(
      `grant select, insert, update, delete on all tables in schema public to ${quoteIdentifier(testRole)}`,
    );
    await grantPool.query(
      `grant usage, select, update on all sequences in schema public to ${quoteIdentifier(testRole)}`,
    );
  } finally {
    await grantPool.end();
  }

  execFileSync("pnpm", ["--filter", "api", "db:seed"], {
    cwd: repoRoot,
    env: commandEnv,
    stdio: "inherit",
  });
};

const createWorkerContext = (): Promise<INestApplicationContext> =>
  NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
    abortOnError: false,
  });

describe.skipIf(!workerE2eEnabled)("standalone worker PostgreSQL processing (e2e)", () => {
  let workerA: INestApplicationContext;
  let workerB: INestApplicationContext;
  let database: DatabaseClient;
  let tenantContextA: TenantContextService;
  let tenantContextB: TenantContextService;
  let tenant: WorkerTenant;

  beforeAll(async () => {
    await resetWorkerDatabase();
    workerA = await createWorkerContext();
    workerB = await createWorkerContext();
    database = workerA.get<DatabaseClient>(DATABASE);
    tenantContextA = workerA.get(TenantContextService);
    tenantContextB = workerB.get(TenantContextService);

    const [user] = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx.select().from(users).where(eq(users.email, "user@example.local")).limit(1),
    );
    const [membership] = user
      ? await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
          tx
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.userId, user.id))
            .limit(1),
        )
      : [];

    if (!user || !membership) {
      throw new Error("Worker integration fixture did not seed the default tenant user");
    }
    tenant = { organizationId: membership.organizationId, userId: user.id };
  }, 120000);

  afterAll(async () => {
    await workerB?.close();
    await workerA?.close();
  });

  const withTenant = <T>(operation: () => Promise<T>): Promise<T> =>
    tenantContextA.runAsync({ tenantId: tenant.organizationId, userId: tenant.userId }, operation);

  const withWorker = <T>(context: TenantContextService, operation: () => Promise<T>): Promise<T> =>
    context.runAsync(WORKER_DISPATCH_CONTEXT, operation);

  it("processes generic and notification jobs through the worker composition", async () => {
    let handlerCalls = 0;
    const jobsService = workerA.get(JobsService);
    jobsService.registerHandler("test.worker.success", async () => {
      handlerCalls += 1;
    });
    const jobsRepository = workerA.get(JobsRepository);
    const notificationJobsRepository = workerA.get(NotificationJobsRepository);

    const [genericJob, notificationJob] = await withTenant(async () => {
      const generic = await jobsRepository.create({
        type: "test.worker.success",
        payload: { source: "worker-e2e" },
        scheduledAt: new Date(Date.now() - 60_000),
        createdById: tenant.userId,
        organizationId: tenant.organizationId,
        maxAttempts: 3,
        status: "PENDING",
      });
      const notification = await notificationJobsRepository.create({
        organizationId: tenant.organizationId,
        actorId: tenant.userId,
        audience: "USER",
        targetUserId: tenant.userId,
        userIds: null,
        type: "worker.e2e",
        title: "Worker integration",
        body: "Processed by the standalone worker context",
        data: { source: "worker-e2e" },
        scheduledAt: new Date(Date.now() - 60_000),
        status: "PENDING",
      });
      await database.insert(notificationDeviceTokens).values({
        userId: tenant.userId,
        token: `worker-e2e-token-${Date.now()}`,
        platform: "IOS",
      });
      return [generic, notification] as const;
    });

    if (!genericJob || !notificationJob) throw new Error("Could not seed due worker jobs");
    await jobsService.processDueJobs();
    await workerA.get(NotificationsService).processDueJobs();

    const generic = await withWorker(tenantContextA, () =>
      jobsRepository.findById(genericJob.id, {
        type: "organization",
        organizationId: tenant.organizationId,
      }),
    );
    const genericEvents = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx.select({ type: jobEvents.type }).from(jobEvents).where(eq(jobEvents.jobId, genericJob.id)),
    );
    const notification = await withWorker(tenantContextA, () =>
      notificationJobsRepository.findById(notificationJob.id),
    );
    const inbox = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx.select().from(notifications).where(eq(notifications.sourceJobId, notificationJob.id)),
    );
    const deliveries = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx
        .select()
        .from(notificationDeliveries)
        .where(
          inArray(
            notificationDeliveries.notificationId,
            inbox.map((row) => row.id),
          ),
        ),
    );

    expect(handlerCalls).toBe(1);
    expect(generic?.status).toBe("COMPLETED");
    expect(genericEvents.map((event) => event.type)).toEqual(
      expect.arrayContaining(["claimed", "completed"]),
    );
    expect(notification?.status).toBe("COMPLETED");
    expect(notification?.recipientCount).toBe(1);
    expect(inbox).toHaveLength(1);
    expect(deliveries).toHaveLength(1);
  });

  it("records retry state when a worker handler fails", async () => {
    const jobsService = workerA.get(JobsService);
    jobsService.registerHandler("test.worker.failure", async () => {
      throw new Error("worker integration failure");
    });
    const jobsRepository = workerA.get(JobsRepository);
    const job = await withTenant(() =>
      jobsRepository.create({
        type: "test.worker.failure",
        payload: {},
        scheduledAt: new Date(Date.now() - 60_000),
        createdById: tenant.userId,
        organizationId: tenant.organizationId,
        maxAttempts: 2,
        status: "PENDING",
      }),
    );
    if (!job) throw new Error("Could not seed retry job");

    await jobsService.processDueJobs();
    const retried = await withWorker(tenantContextA, () =>
      jobsRepository.findById(job.id, {
        type: "organization",
        organizationId: tenant.organizationId,
      }),
    );
    const events = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx.select({ type: jobEvents.type }).from(jobEvents).where(eq(jobEvents.jobId, job.id)),
    );

    expect(retried?.status).toBe("PENDING");
    expect(retried?.attempts).toBe(1);
    expect(events.map((event) => event.type)).toContain("retry_scheduled");
  });

  it("keeps concurrent worker claims disjoint with PostgreSQL SKIP LOCKED", async () => {
    const jobsRepositoryA = workerA.get(JobsRepository);
    const jobsRepositoryB = workerB.get(JobsRepository);
    const ids = await withTenant(async () => {
      const created: string[] = [];
      for (let index = 0; index < 6; index += 1) {
        const job = await jobsRepositoryA.create({
          type: "test.worker.claim",
          payload: { index },
          scheduledAt: new Date(Date.now() - 60_000),
          createdById: tenant.userId,
          organizationId: tenant.organizationId,
          maxAttempts: 3,
          status: "PENDING",
        });
        if (!job) throw new Error("Could not seed claim job");
        created.push(job.id);
      }
      return created;
    });

    const [claimedA, claimedB] = await Promise.all([
      withWorker(tenantContextA, () => jobsRepositoryA.claimDueJobs(3, "worker-a")),
      withWorker(tenantContextB, () => jobsRepositoryB.claimDueJobs(3, "worker-b")),
    ]);
    const claimedIdsA = claimedA.map((job) => job.id);
    const claimedIdsB = claimedB.map((job) => job.id);

    expect(claimedIdsA.filter((id) => claimedIdsB.includes(id))).toEqual([]);
    expect(new Set([...claimedIdsA, ...claimedIdsB])).toEqual(new Set(ids));
  });

  it("recovers stale generic and notification jobs after worker interruption", async () => {
    const jobsRepository = workerA.get(JobsRepository);
    const notificationJobsRepository = workerA.get(NotificationJobsRepository);
    const staleLease = new Date(Date.now() - 60_000);
    const staleUpdatedAt = new Date(Date.now() - 11 * 60_000);
    const [genericRetry, genericFailed, notificationRetry, notificationFailed] = await withTenant(
      async () => [
        await jobsRepository.create({
          type: "test.worker.claim",
          payload: {},
          scheduledAt: new Date(Date.now() - 60_000),
          status: "PROCESSING",
          attempts: 1,
          maxAttempts: 3,
          leaseExpiresAt: staleLease,
          processingStartedAt: staleLease,
          workerId: "crashed-worker",
          organizationId: tenant.organizationId,
          createdById: tenant.userId,
        }),
        await jobsRepository.create({
          type: "test.worker.claim",
          payload: {},
          scheduledAt: new Date(Date.now() - 60_000),
          status: "PROCESSING",
          attempts: 3,
          maxAttempts: 3,
          leaseExpiresAt: staleLease,
          processingStartedAt: staleLease,
          workerId: "crashed-worker",
          organizationId: tenant.organizationId,
          createdById: tenant.userId,
        }),
        await notificationJobsRepository.create({
          organizationId: tenant.organizationId,
          actorId: tenant.userId,
          audience: "USER",
          targetUserId: tenant.userId,
          type: "worker.stale.retry",
          title: "Stale retry",
          body: "Recover this job",
          scheduledAt: new Date(Date.now() - 60_000),
          status: "PROCESSING",
          attempts: 1,
          updatedAt: staleUpdatedAt,
        }),
        await notificationJobsRepository.create({
          organizationId: tenant.organizationId,
          actorId: tenant.userId,
          audience: "USER",
          targetUserId: tenant.userId,
          type: "worker.stale.failed",
          title: "Stale failed",
          body: "Fail this job",
          scheduledAt: new Date(Date.now() - 60_000),
          status: "PROCESSING",
          attempts: 3,
          updatedAt: staleUpdatedAt,
        }),
      ],
    );

    if (!genericRetry || !genericFailed || !notificationRetry || !notificationFailed) {
      throw new Error("Could not seed stale jobs");
    }
    const genericRecovery = await withWorker(tenantContextA, () =>
      jobsRepository.recoverStaleProcessing(),
    );
    const notificationRecovery = await withWorker(tenantContextA, () =>
      notificationJobsRepository.recoverStaleProcessing(1, 3),
    );

    expect(genericRecovery.requeued.map((job) => job.id)).toContain(genericRetry.id);
    expect(genericRecovery.failed.map((job) => job.id)).toContain(genericFailed.id);
    expect(notificationRecovery.recovered.map((job) => job.id)).toContain(notificationRetry.id);
    expect(notificationRecovery.failed.map((job) => job.id)).toContain(notificationFailed.id);
  });
});
