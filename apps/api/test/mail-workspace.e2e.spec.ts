import type { INestApplication } from '@nestjs/common';

import { JobsService } from '@repo/api-platform/modules/jobs/application/jobs.service';
import { ERROR_CODES } from '@repo/api-core';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, loginAs, resetTestDatabase } from './support/test-app';

describe('Mail workspace: send, templates, preview (e2e)', () => {
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

  it('lists templates with mandatory and sendable flags', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/mail/templates')
      .set(bearer(admin.accessToken))
      .expect(200);

    const welcome = response.body.data.find(
      (template: { key: string }) => template.key === 'auth.welcome',
    );
    const resetPassword = response.body.data.find(
      (template: { key: string }) => template.key === 'auth.reset-password',
    );

    expect(welcome).toMatchObject({ mandatory: false, sendable: true });
    expect(resetPassword).toMatchObject({ mandatory: true, sendable: false });
  });

  it('previews a template with custom variables and reports missing ones', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    const customized = await request(app.getHttpServer())
      .get('/api/v1/admin/mail/preview/auth.welcome')
      .query({ variables: JSON.stringify({ displayName: 'Custom Name' }) })
      .set(bearer(admin.accessToken))
      .expect(200);

    expect(customized.body.data.text).toContain('Custom Name');
    expect(customized.body.data.missingVariables).toEqual([]);
  });

  it('rejects sending mandatory security templates ad hoc', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/mail/send')
      .set(bearer(admin.accessToken))
      .send({ templateKey: 'auth.reset-password', to: 'someone@example.test' })
      .expect(400);
    expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
  });

  it('rejects sending when a required template variable is missing', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/mail/send')
      .set(bearer(admin.accessToken))
      .send({ templateKey: 'auth.welcome', to: 'someone@example.test' })
      .expect(400);
    expect(response.body.error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
  });

  it('enqueues a mail.send job, replays via idempotency key, and completes delivery', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');
    const recipient = `mail-send-${Date.now()}@example.test`;
    const idempotencyKey = `mail-send-${Date.now()}`;

    const first = await request(app.getHttpServer())
      .post('/api/v1/admin/mail/send')
      .set(bearer(admin.accessToken))
      .send({
        templateKey: 'auth.welcome',
        to: recipient,
        variables: { displayName: 'E2E Recipient', webUrl: 'https://example.test/login' },
        idempotencyKey,
      })
      .expect(201);

    const { jobId } = first.body.data as { jobId: string; status: string };
    expect(jobId).toBeTruthy();

    const jobBeforeProcessing = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${jobId}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(jobBeforeProcessing.body.data.type).toBe('mail.send');
    expect(jobBeforeProcessing.body.data.payload).toMatchObject({
      templateKey: 'auth.welcome',
      to: recipient,
    });

    // Replaying the same idempotency key must not create a second job.
    const replay = await request(app.getHttpServer())
      .post('/api/v1/admin/mail/send')
      .set(bearer(admin.accessToken))
      .send({
        templateKey: 'auth.welcome',
        to: recipient,
        variables: { displayName: 'E2E Recipient', webUrl: 'https://example.test/login' },
        idempotencyKey,
      })
      .expect(201);
    expect(replay.body.data.jobId).toBe(jobId);

    await app.get(JobsService).processDueJobs();

    const jobAfterProcessing = await request(app.getHttpServer())
      .get(`/api/v1/admin/jobs/${jobId}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(['COMPLETED', 'FAILED']).toContain(jobAfterProcessing.body.data.status);

    const deliveries = await request(app.getHttpServer())
      .get('/api/v1/admin/mail/deliveries')
      .query({ templateKey: 'auth.welcome', limit: 50 })
      .set(bearer(admin.accessToken))
      .expect(200);
    const delivery = deliveries.body.data.find(
      (row: { recipient: string }) => row.recipient === recipient,
    );
    expect(delivery).toBeDefined();
  });
});
