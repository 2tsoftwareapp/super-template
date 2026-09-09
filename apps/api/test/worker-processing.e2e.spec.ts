import type { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WORKER_DISPATCH_CONTEXT } from "@repo/api-kernel";
import { TenantContextService } from "@repo/api-runtime";
import { type DatabaseClient, DATABASE, withTenantContext } from "@repo/database-runtime";
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
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { seedDatabase } from "../src/cli/seeds/seed-data";
import { WorkerModule } from "../../worker/src/worker.module";
import { resetTestDatabase } from "./support/test-app";

interface WorkerTenant {
  organizationId: string;
  userId: string;
}

const createWorkerContext = async (): Promise<INestApplicationContext> => {
  return NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
    abortOnError: false,
  });
};

describe("standalone worker PostgreSQL processing (e2e)", () => {
  let workerA: INestApplicationContext;
  let workerB: INestApplicationContext;
  let database: DatabaseClient;
  let tenantContextA: TenantContextService;
  let tenantContextB: TenantContextService;
  let tenant: WorkerTenant;

  beforeAll(async () => {
    await resetTestDatabase();
    workerA = await createWorkerContext();
    await seedDatabase(workerA);
    workerB = await createWorkerContext();

    database = workerA.get<DatabaseClient>(DATABASE);
    tenantContextA = workerA.get(TenantContextService);
    tenantContextB = workerB.get(TenantContextService);

    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.email, "user@example.local"))
      .limit(1);
    const [membership] = user
      ? await database
          .select()
          .from(organizationMembers)
          .where(eq(organizationMembers.userId, user.id))
          .limit(1)
      : [];

    if (!membership || !user) {
      throw new Error("Worker integration fixture did not seed the default tenant user");
    }

    tenant = { organizationId: membership.organizationId, userId: user.id };
  }, 120000);

  afterAll(async () => {
    await workerB?.close();
    await workerA?.close();
  });

  const withTenant = <T>(operation: () => Promise<T>): Promise<T> =>
    tenantContextA.runAsync(
      { tenantId: tenant.organizationId, userId: tenant.userId },
      operation,
    );

  const withWorkerContext = <T>(
    context: TenantContextService,
    operation: () => Promise<T>,
  ): Promise<T> => context.runAsync(WORKER_DISPATCH_CONTEXT, operation);

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
        priority: 0,
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

    if (!genericJob || !notificationJob) {
      throw new Error("Worker integration fixture could not create due jobs");
    }

    await jobsService.processDueJobs();
    await workerA.get(NotificationsService).processDueJobs();

    const processedGeneric = await withWorkerContext(tenantContextA, () =>
      jobsRepository.findById(genericJob.id, {
        type: "organization",
        organizationId: tenant.organizationId,
      }),
    );
    const genericEvents = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx
        .select({ type: jobEvents.type })
        .from(jobEvents)
        .where(eq(jobEvents.jobId, genericJob.id)),
    );
    const processedNotification = await withWorkerContext(tenantContextA, () =>
      notificationJobsRepository.findById(notificationJob.id),
    );
    const inboxRows = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx
        .select()
        .from(notifications)
        .where(eq(notifications.sourceJobId, notificationJob.id)),
    );
    const deliveryRows = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx
        .select()
        .from(notificationDeliveries)
        .where(inArray(notificationDeliveries.notificationId, inboxRows.map((row) => row.id))),
    );

    expect(handlerCalls).toBe(1);
    expect(processedGeneric?.status).toBe("COMPLETED");
    expect(genericEvents.map((event) => event.type)).toEqual(
      expect.arrayContaining(["claimed", "completed"]),
    );
    expect(processedNotification?.status).toBe("COMPLETED");
    expect(processedNotification?.recipientCount).toBe(1);
    expect(inboxRows).toHaveLength(1);
    expect(deliveryRows).toHaveLength(1);
    expect(deliveryRows[0]?.status).toBe("PENDING");
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
        payload: { source: "worker-e2e" },
        scheduledAt: new Date(Date.now() - 60_000),
        priority: 0,
        createdById: tenant.userId,
        organizationId: tenant.organizationId,
        maxAttempts: 2,
        status: "PENDING",
      }),
    );

    if (!job) {
      throw new Error("Worker integration fixture could not create retry job");
    }

    await jobsService.processDueJobs();

    const retried = await withWorkerContext(tenantContextA, () =>
      jobsRepository.findById(job.id, {
        type: "organization",
        organizationId: tenant.organizationId,
      }),
    );
    const events = await withTenantContext(database, WORKER_DISPATCH_CONTEXT, (tx) =>
      tx
        .select({ type: jobEvents.type })
        .from(jobEvents)
        .where(eq(jobEvents.jobId, job.id)),
    );

    expect(retried?.status).toBe("PENDING");
    expect(retried?.attempts).toBe(1);
    expect(events.map((event) => event.type)).toContain("retry_scheduled");
  });

  it("keeps concurrent worker claims disjoint with PostgreSQL SKIP LOCKED", async () => {
    const jobsRepositoryA = workerA.get(JobsRepository);
    const jobsRepositoryB = workerB.get(JobsRepository);
    const jobsToClaim = await withTenant(async () => {
      const created = [];
      for (let index = 0; index < 6; index += 1) {
        const job = await jobsRepositoryA.create({
          type: "test.worker.claim",
          payload: { index },
          scheduledAt: new Date(Date.now() - 60_000),
          priority: 0,
          createdById: tenant.userId,
          organizationId: tenant.organizationId,
          maxAttempts: 3,
          status: "PENDING",
        });
        if (!job) throw new Error("Worker integration fixture could not create claim job");
        created.push(job.id);
      }
      return created;
    });

    const [claimedA, claimedB] = await Promise.all([
      withWorkerContext(tenantContextA, () => jobsRepositoryA.claimDueJobs(3, "worker-a")),
      withWorkerContext(tenantContextB, () => jobsRepositoryB.claimDueJobs(3, "worker-b")),
    ]);
    const claimedIdsA = claimedA.map((job) => job.id);
    const claimedIdsB = claimedB.map((job) => job.id);
    const overlap = claimedIdsA.filter((id) => claimedIdsB.includes(id));
    const claimedUnion = new Set([...claimedIdsA, ...claimedIdsB]);

    expect(overlap).toEqual([]);
    expect(claimedUnion).toEqual(new Set(jobsToClaim));
  });

  it("recovers stale generic and notification jobs after worker interruption", async () => {
    const jobsRepository = workerA.get(JobsRepository);
    const notificationJobsRepository = workerA.get(NotificationJobsRepository);
    const staleLease = new Date(Date.now() - 60_000);
    const staleUpdatedAt = new Date(Date.now() - 11 * 60_000);

    const [genericRetry, genericExhausted, notificationRetry, notificationExhausted] =
      await withTenant(async () => {
        const genericRetryJob = await jobsRepository.create({
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
        });
        const genericExhaustedJob = await jobsRepository.create({
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
        });
        const notificationRetryJob = await notificationJobsRepository.create({
          organizationId: tenant.organizationId,
          actorId: tenant.userId,
          audience: "USER",
          targetUserId: tenant.userId,
          userIds: null,
          type: "worker.stale.retry",
          title: "Stale retry",
          body: "Recover this job",
          data: null,
          scheduledAt: new Date(Date.now() - 60_000),
          status: "PROCESSING",
          attempts: 1,
          updatedAt: staleUpdatedAt,
        });
        const notificationExhaustedJob = await notificationJobsRepository.create({
          organizationId: tenant.organizationId,
          actorId: tenant.userId,
          audience: "USER",
          targetUserId: tenant.userId,
          userIds: null,
          type: "worker.stale.exhausted",
          title: "Stale exhausted",
          body: "Fail this job",
          data: null,
          scheduledAt: new Date(Date.now() - 60_000),
          status: "PROCESSING",
          attempts: 3,
          updatedAt: staleUpdatedAt,
        });
        return [
          genericRetryJob,
          genericExhaustedJob,
          notificationRetryJob,
          notificationExhaustedJob,
        ] as const;
      });

    if (!genericRetry || !genericExhausted || !notificationRetry || !notificationExhausted) {
      throw new Error("Worker integration fixture could not create stale jobs");
    }

    const genericRecovery = await withWorkerContext(tenantContextA, () =>
      jobsRepository.recoverStaleProcessing(),
    );
    const notificationRecovery = await withWorkerContext(tenantContextA, () =>
      notificationJobsRepository.recoverStaleProcessing(1, 3),
    );

    expect(genericRecovery.requeued.map((job) => job.id)).toContain(genericRetry.id);
    expect(genericRecovery.failed.map((job) => job.id)).toContain(genericExhausted.id);
    expect(notificationRecovery.recovered.map((job) => job.id)).toContain(notificationRetry.id);
    expect(notificationRecovery.failed.map((job) => job.id)).toContain(notificationExhausted.id);
  });
});
