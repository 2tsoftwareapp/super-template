import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  bearer,
  createTestApp,
  loginAs,
  resetTestDatabase,
} from './support/test-app';

describe('Tenant isolation (e2e)', () => {
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

  it('keeps projects isolated per organization in list responses', async () => {
    const adminSession = await loginAs(
      app,
      'admin@example.local',
      'ChangeMe123!',
    );
    const userSession = await loginAs(
      app,
      'user@example.local',
      'ChangeMe123!',
    );

    const adminProjects = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set(bearer(adminSession.accessToken))
      .expect(200);

    const userProjects = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set(bearer(userSession.accessToken))
      .expect(200);

    const adminNames = adminProjects.body.data.map(
      (project: { name: string }) => project.name,
    );
    const userNames = userProjects.body.data.map(
      (project: { name: string }) => project.name,
    );

    expect(adminNames).toContain('Starter Admin Project');
    expect(userNames).toContain('Starter User Project');
    expect(adminNames).not.toContain('Starter User Project');
    expect(userNames).not.toContain('Starter Admin Project');
  });

  it('lists organizations for the authenticated user', async () => {
    const userSession = await loginAs(
      app,
      'user@example.local',
      'ChangeMe123!',
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/organizations')
      .set(bearer(userSession.accessToken))
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toMatchObject({
      current: true,
      role: 'OWNER',
    });
  });
});
