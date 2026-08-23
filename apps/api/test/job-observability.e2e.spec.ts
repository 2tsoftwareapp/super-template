import type { INestApplication } from "@nestjs/common";

import { JobsService } from "@platform/modules/jobs/application/jobs.service";
import { JobsRepository } from "@platform/modules/jobs/infrastructure/jobs.repository";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  bearer,
  createTestApp,
  loginAs,
  resetTestDatabase,
  runWithTenantContext,
} from "./support/test-app";

describe("Job observability: attempts, events, metrics, dependencies (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    await resetTestDatabase();
    app = await createTestApp();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const seedJob = async (
    organizationId: string,
    userId: string,
    overrides: Partial<{ type: string; maxAttempts: number }> = {},
  ) => {
    const jobsRepository = app.get(JobsRepository);

    const job = await runWithTenantContext(app, { tenantId: organizationId, userId }, () =>
      jobsRepository.create({
        type: overrides.type ?? "files.cleanup",
        payload: {},
        scheduledAt: new Date(Date.now() - 60_000),
        priority: 0,
        createdById: userId,
        organizationId,
        maxAttempts: overrides.maxAttempts ?? 3,
        status: "PENDING",
      }),
    );

    if (!job) {
      throw new Error("Failed to seed job");
    }

    return job;
  };

  it("records claimed and completed events for a successful job", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(admin.accessToken))
      .expect(200);
    const organizationId = me.body.data.organizationId as string;

    const job = await seedJob(organizationId, admin.userId);

    await app.get(JobsService).processDueJobs();

    const logs = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${job.id}/logs`)
      .set(bearer(admin.accessToken))
      .expect(200);

    const types = logs.body.data.map((event: { type: string }) => event.type);
    expect(types).toContain("claimed");
    expect(types).toContain("completed");

    const jobDetail = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${job.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(jobDetail.body.data.status).toBe("COMPLETED");
  });

  it("records a no_handler event and fails the job when no handler is registered", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(admin.accessToken))
      .expect(200);
    const organizationId = me.body.data.organizationId as string;

    const job = await seedJob(organizationId, admin.userId, {
      type: "test.unregistered-job-type",
    });

    await app.get(JobsService).processDueJobs();

    const logs = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${job.id}/logs`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(logs.body.data.map((event: { type: string }) => event.type)).toContain("no_handler");

    const jobDetail = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${job.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(jobDetail.body.data.status).toBe("FAILED");
  });

  it("schedules a retry and records retry_scheduled when attempts remain", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(admin.accessToken))
      .expect(200);
    const organizationId = me.body.data.organizationId as string;

    app.get(JobsService).registerHandler("test.always-fails", async () => {
      throw new Error("synthetic failure");
    });

    const retryableJob = await seedJob(organizationId, admin.userId, {
      type: "test.always-fails",
      maxAttempts: 2,
    });
    const exhaustedJob = await seedJob(organizationId, admin.userId, {
      type: "test.always-fails",
      maxAttempts: 1,
    });

    await app.get(JobsService).processDueJobs();

    const retryableLogs = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${retryableJob.id}/logs`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(retryableLogs.body.data.map((event: { type: string }) => event.type)).toContain(
      "retry_scheduled",
    );
    const retryableDetail = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${retryableJob.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(retryableDetail.body.data.status).toBe("PENDING");

    const exhaustedLogs = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${exhaustedJob.id}/logs`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(exhaustedLogs.body.data.map((event: { type: string }) => event.type)).toContain(
      "failed",
    );
    const exhaustedDetail = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${exhaustedJob.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(exhaustedDetail.body.data.status).toBe("FAILED");
  });

  it("records a cancelled event when a pending job is cancelled", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(admin.accessToken))
      .expect(200);
    const organizationId = me.body.data.organizationId as string;
    const job = await seedJob(organizationId, admin.userId);

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/jobs/${job.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);

    const logs = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${job.id}/logs`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(logs.body.data.map((event: { type: string }) => event.type)).toContain("cancelled");
  });

  it("blocks claiming a job until its dependency completes, and prevents cycles", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(admin.accessToken))
      .expect(200);
    const organizationId = me.body.data.organizationId as string;

    const prerequisite = await seedJob(organizationId, admin.userId);
    const dependent = await seedJob(organizationId, admin.userId);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/jobs/${dependent.id}/dependencies`)
      .set(bearer(admin.accessToken))
      .send({ dependsOnJobId: prerequisite.id })
      .expect(201);

    // Self-dependency and cycles are rejected.
    await request(app.getHttpServer())
      .post(`/api/v1/admin/jobs/${dependent.id}/dependencies`)
      .set(bearer(admin.accessToken))
      .send({ dependsOnJobId: dependent.id })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/api/v1/admin/jobs/${prerequisite.id}/dependencies`)
      .set(bearer(admin.accessToken))
      .send({ dependsOnJobId: dependent.id })
      .expect(409);

    const dependencies = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${dependent.id}/dependencies`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(dependencies.body.data).toHaveLength(1);
    expect(dependencies.body.data[0].dependsOnJobId).toBe(prerequisite.id);

    // First processing pass: prerequisite completes, dependent is skipped (still PENDING).
    await app.get(JobsService).processDueJobs();

    const dependentAfterFirstPass = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${dependent.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(dependentAfterFirstPass.body.data.status).toBe("PENDING");

    const prerequisiteAfterFirstPass = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${prerequisite.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(prerequisiteAfterFirstPass.body.data.status).toBe("COMPLETED");

    // Second pass: prerequisite is COMPLETED, so the dependent can now be claimed.
    await app.get(JobsService).processDueJobs();

    const dependentAfterSecondPass = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${dependent.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(dependentAfterSecondPass.body.data.status).toBe("COMPLETED");
  });

  it("exposes aggregate metrics by status and type", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");

    const metrics = await request(app.getHttpServer())
      .get("/api/v1/admin/jobs/metrics")
      .set(bearer(admin.accessToken))
      .expect(200);

    expect(metrics.body.data.byStatus).toBeInstanceOf(Array);
    expect(metrics.body.data.byType).toBeInstanceOf(Array);
    expect(typeof metrics.body.data.retryRate).toBe("number");
    expect(typeof metrics.body.data.failureRate).toBe("number");
    expect(metrics.body.data.totalCompleted).toBeGreaterThanOrEqual(0);
  });
});
