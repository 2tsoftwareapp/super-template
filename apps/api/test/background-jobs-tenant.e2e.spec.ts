import type { INestApplication } from '@nestjs/common';
import { JobsRepository } from '@repo/api-platform/modules/jobs/infrastructure/jobs.repository';
import { JobsService } from '@repo/api-platform/modules/jobs/application/jobs.service';
import { NotificationJobsRepository } from '@repo/api-workspace/modules/notifications/infrastructure/notification-jobs.repository';
import { NotificationsService } from '@repo/api-workspace/modules/notifications/application/notifications.service';
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
      () => jobsRepository.findById(job.id),
    );
    expect(processed?.status).toBe('COMPLETED');
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

    expect(second.id).toBe(first.id);
  });
});
