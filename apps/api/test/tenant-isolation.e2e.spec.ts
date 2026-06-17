import type { INestApplication } from '@nestjs/common';
import { AccessControlService, ROLE_NAMES } from '@repo/api-identity';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  bearer,
  createTestApp,
  getCurrentDatabaseUser,
  getTestAppRoleName,
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

  it('runs tenant-scoped queries under the restricted test role', async () => {
    expect(await getCurrentDatabaseUser(app)).toBe(getTestAppRoleName());
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

  it('prevents an org-scoped ADMIN from reading another organization project', async () => {
    const superAdminSession = await loginAs(
      app,
      'admin@example.local',
      'ChangeMe123!',
    );
    const accessControlService = app.get(AccessControlService);
    const adminRole = await accessControlService.getRoleByName(ROLE_NAMES.ADMIN);

    if (!adminRole) {
      throw new Error('ADMIN role was not found');
    }

    const orgAdminA = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(superAdminSession.accessToken))
      .send({
        email: 'org-admin-a@example.local',
        password: 'OrgAdminPass123!',
        displayName: 'Org Admin A',
        status: 'ACTIVE',
        roleIds: [adminRole.id],
      })
      .expect(201);

    const orgAdminB = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(superAdminSession.accessToken))
      .send({
        email: 'org-admin-b@example.local',
        password: 'OrgAdminPass123!',
        displayName: 'Org Admin B',
        status: 'ACTIVE',
        roleIds: [adminRole.id],
      })
      .expect(201);

    const orgAdminBSession = await loginAs(
      app,
      'org-admin-b@example.local',
      'OrgAdminPass123!',
    );

    const createdProject = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set(bearer(orgAdminBSession.accessToken))
      .send({
        name: 'Org B Confidential Project',
        description: 'Should stay invisible to org A admin',
      })
      .expect(201);

    const orgAdminASession = await loginAs(
      app,
      'org-admin-a@example.local',
      'OrgAdminPass123!',
    );

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set(bearer(orgAdminASession.accessToken))
      .expect(200);

    const visibleNames = listResponse.body.data.map(
      (project: { name: string }) => project.name,
    );

    expect(visibleNames).not.toContain('Org B Confidential Project');

    const forbiddenRead = await request(app.getHttpServer())
      .get(`/api/v1/projects/${createdProject.body.data.id}`)
      .set(bearer(orgAdminASession.accessToken))
      .expect(404);

    expect(forbiddenRead.body.error.code).toBe('PROJECT_NOT_FOUND');

    const forbiddenUpdate = await request(app.getHttpServer())
      .patch(`/api/v1/projects/${createdProject.body.data.id}`)
      .set(bearer(orgAdminASession.accessToken))
      .send({ name: 'Compromised project name' })
      .expect(404);

    expect(forbiddenUpdate.body.error.code).toBe('PROJECT_NOT_FOUND');

    expect(orgAdminA.body.data.roles).toEqual(
      expect.arrayContaining([ROLE_NAMES.ADMIN]),
    );
    expect(orgAdminB.body.data.roles).toEqual(
      expect.arrayContaining([ROLE_NAMES.ADMIN]),
    );
  });
});
