import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bearer, createTestApp, loginAs, resetTestDatabase } from './support/test-app';

describe('Audit logs (e2e)', () => {
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

  const createActiveUser = async (
    admin: { accessToken: string },
    email: string,
  ) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(admin.accessToken))
      .send({
        email,
        password: 'ChangeMe123!',
        displayName: 'Audit Test User',
        status: 'ACTIVE',
      })
      .expect(201);

    return response.body.data as { id: string };
  };

  it('searches audit logs by free-text query across action and entity type', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');
    const marker = `audit-search-${Date.now()}@example.test`;
    await createActiveUser(admin, marker);

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .query({ q: 'admin.user.created' })
      .set(bearer(admin.accessToken))
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    for (const row of response.body.data) {
      expect(row.action).toBe('admin.user.created');
    }

    const noMatch = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .query({ q: 'no-such-action-exists' })
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(noMatch.body.data).toHaveLength(0);
  });

  it('rejects listing and exporting audit logs without authentication', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/admin/audit-logs/export')
      .send({})
      .expect(401);
  });

  it('exports filtered audit logs as a downloadable CSV file scoped to the actor org', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');
    const marker = `audit-export-${Date.now()}@example.test`;
    await createActiveUser(admin, marker);

    const exportResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/audit-logs/export')
      .set(bearer(admin.accessToken))
      .send({ q: 'admin.user.created' })
      .expect(201);

    const { fileId, rowCount } = exportResponse.body.data as {
      fileId: string;
      rowCount: number;
    };
    expect(fileId).toBeTruthy();
    expect(rowCount).toBeGreaterThan(0);

    const fileMeta = await request(app.getHttpServer())
      .get(`/api/v1/files/${fileId}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(fileMeta.body.data.mimeType).toBe('text/csv');

    const signedUrl = await request(app.getHttpServer())
      .get(`/api/v1/files/${fileId}/url`)
      .set(bearer(admin.accessToken))
      .expect(200);
    const downloadToken = new URL(
      signedUrl.body.data.url,
      'http://localhost',
    ).searchParams.get('token')!;

    const download = await request(app.getHttpServer())
      .get(`/api/v1/files/${fileId}/download`)
      .query({ token: downloadToken })
      .set(bearer(admin.accessToken))
      .expect(200);
    const csv = Buffer.from(download.body as Buffer).toString('utf8');
    expect(csv.split('\n')[0]).toContain('action');
    expect(csv).toContain('admin.user.created');

    // The export itself is recorded as its own audit entry.
    const exportedLog = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .query({ q: 'audit.exported' })
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(exportedLog.body.data.length).toBeGreaterThan(0);
  });

  it('caps export queries to the maximum row safety bound via the same filters as listing', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    const exportResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/audit-logs/export')
      .set(bearer(admin.accessToken))
      .send({ action: 'no-such-action' })
      .expect(201);

    expect(exportResponse.body.data.rowCount).toBe(0);
  });
});
