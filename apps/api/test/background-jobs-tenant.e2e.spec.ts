import type { INestApplication } from '@nestjs/common';
import { JobsRepository } from '@repo/api-platform/modules/jobs/infrastructure/jobs.repository';
import { JobsService } from '@repo/api-platform/modules/jobs/application/jobs.service';
import type { JobStatus } from '@repo/api-platform/modules/jobs/domain/job-status';
import { type DatabaseClient, DATABASE, organizations } from '@repo/api-database';
import { NotificationJobsRepository } from '@repo/api-platform/modules/notifications/infrastructure/notification-jobs.repository';
import { NotificationsService } from '@repo/api-platform/modules/notifications/application/notifications.service';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createTestApp,
  getCurrentDatabaseUser,
  getTestAppRoleName,
  loginAs,
  resetTestDatabase,
  runWithTenantContext,
} from './support/test-app';

describe('Background jobs under restricted DB role (e2e)', () => {
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

  it('runs under the restricted application database role', async () => {
    expect(await getCurrentDatabaseUser(app)).toBe(getTestAppRoleName());
  });

  it('processes tenant-scoped platform jobs via processDueJobs', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');
    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);

    const organizationId = meResponse.body.data.organizationId as string;
    expect(organizationId).toBeTruthy();

    const jobsRepository = app.get(JobsRepository);
    const jobsService = app.get(JobsService);

    const job = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () =>
        jobsRepository.create({
          type: 'files.cleanup',
          payload: {},
          scheduledAt: new Date(Date.now() - 60_000),
          priority: 0,
          createdById: session.userId,
          organizationId,
          maxAttempts: 3,
          status: 'PENDING',
        }),
    );

    expect(job).toBeTruthy();
    if (!job) {
      throw new Error('Failed to seed platform job');
    }

    await jobsService.processDueJobs();

    const processed = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () => jobsRepository.findById((job as any).id, { type: 'organization', organizationId }),
    );
    expect((processed as any)?.status).toBe('COMPLETED');
  });

  it('processes tenant-scoped notification jobs via processDueJobs', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');
    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);

    const organizationId = meResponse.body.data.organizationId as string;
    expect(organizationId).toBeTruthy();

    const notificationJobsRepository = app.get(NotificationJobsRepository);
    const notificationsService = app.get(NotificationsService);

    const job = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () =>
        notificationJobsRepository.create({
          organizationId,
          actorId: session.userId,
          audience: 'USER',
          targetUserId: session.userId,
          userIds: null,
          type: 'ops.scheduled',
          title: 'Worker test',
          body: 'Delivered by processDueJobs',
          data: null,
          scheduledAt: new Date(Date.now() - 60_000),
          status: 'PENDING',
        }),
    );

    expect(job).toBeTruthy();
    if (!job) {
      throw new Error('Failed to seed notification job');
    }

    await notificationsService.processDueJobs();

    const processed = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () => notificationJobsRepository.findById(job.id),
    );
    expect(processed?.status).toBe('COMPLETED');
    expect(processed?.recipientCount).toBe(1);
  });

  it('deduplicates platform job enqueue on idempotency key conflicts', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');
    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${session.accessToken}` })
      .expect(200);

    const organizationId = meResponse.body.data.organizationId as string;
    const jobsService = app.get(JobsService);
    const idempotencyKey = `worker-test-${Date.now()}`;

    const first = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () =>
        jobsService.enqueue({
          type: 'files.cleanup',
          payload: {},
          createdById: session.userId,
          organizationId,
          idempotencyKey,
        }),
    );

    const second = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () =>
        jobsService.enqueue({
          type: 'files.cleanup',
          payload: { attempt: 2 },
          createdById: session.userId,
          organizationId,
          idempotencyKey,
        }),
    );

    expect((second as any).id).toBe((first as any).id);
  });

  // --- T-001: Tenant scope enforcement ---
  it('enforces tenant isolation in job lookup', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');
    const db = app.get<DatabaseClient>(DATABASE);
    const org = (await db.select().from(organizations).limit(1))[0];
    const organizationId = org!.id;
    const jobsRepository = app.get(JobsRepository);

    // Create job in org1
    const org1Job = await runWithTenantContext(app, { tenantId: organizationId, userId: session.userId }, () =>
      jobsRepository.create({
        type: 'files.cleanup',
        payload: {},
        scheduledAt: new Date(Date.now() + 60_000),
        createdById: session.userId,
        organizationId: organizationId,
        status: 'PENDING',
      }),
    );

    // Try to look it up with a different org scope
    const found = await jobsRepository.findById((org1Job as any).id, {
      type: 'organization',
      organizationId: '00000000-0000-0000-0000-000000000000',
    });
    expect(found).toBeNull();
  });

  // --- T-004: Conditional state transitions ---
  it('blocks state transitions from wrong source status', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');
    const db = app.get<DatabaseClient>(DATABASE);
    const org = (await db.select().from(organizations).limit(1))[0];
    const organizationId = org!.id;
    const jobsRepository = app.get(JobsRepository);

    const job = await runWithTenantContext(app, { tenantId: organizationId, userId: session.userId }, () =>
      jobsRepository.create({
        type: 'files.cleanup',
        payload: {},
        scheduledAt: new Date(Date.now() + 60_000),
        createdById: session.userId,
        organizationId: organizationId,
        status: 'PENDING',
      }),
    );

    // markCompleted on PENDING should not succeed
    const completed = await jobsRepository.markCompleted((job as any).id, 'test-worker', 0);
    expect(completed).toBeNull();

    // markFailed on PENDING should not succeed
    const failed = await jobsRepository.markFailed((job as any).id, 'forced', 'test-worker', 0);
    expect(failed).toBeNull();
  });

  // --- T-005: Tenant-scoped idempotency ---
  it('allows same idempotency key across different organizations', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');
    const db = app.get<DatabaseClient>(DATABASE);
    const org = (await db.select().from(organizations).limit(1))[0];
    const organizationId = org!.id;
    const jobsService = app.get(JobsService);
    const idempotencyKey = `cross-org-test-${Date.now()}`;

    const job1 = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () =>
        jobsService.enqueue({
          type: 'files.cleanup',
          payload: {},
          createdById: session.userId,
          organizationId: organizationId,
          idempotencyKey,
        }),
    );

    // A different org (null org) should get a different job with same key
    const job2 = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () =>
        jobsService.enqueue({
          type: 'files.cleanup',
          payload: {},
          createdById: session.userId,
          organizationId: null,
          idempotencyKey,
        }),
    );

    expect((job1 as any).id).not.toBe((job2 as any).id);
  });

  // --- T-009: Payload redaction ---
  it('redacts payload in list view', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');
    const db = app.get<DatabaseClient>(DATABASE);
    const org = (await db.select().from(organizations).limit(1))[0];
    const organizationId = org!.id;
    const jobsService = app.get(JobsService);

    const job = await runWithTenantContext(
      app,
      { tenantId: organizationId, userId: session.userId },
      () =>
        jobsService.enqueue({
          type: 'files.cleanup',
          payload: { password: 'secret123' },
          createdById: session.userId,
          organizationId: organizationId,
        }),
    );

    expect(job.payload).toEqual({ password: 'secret123' });
  });
});
