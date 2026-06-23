import type { INestApplication } from '@nestjs/common';

import { ERROR_CODES } from '@repo/api-core';
import { DATABASE, organizationMembers, type DatabaseClient } from '@repo/api-database';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  bearer,
  createTestApp,
  loginAs,
  resetTestDatabase,
} from './support/test-app';

describe('Organization management (e2e)', () => {
  let app: INestApplication;
  let database: DatabaseClient;

  beforeAll(async () => {
    await resetTestDatabase();
    app = await createTestApp();
    database = app.get(DATABASE);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const createActiveUser = async (
    admin: { accessToken: string },
    email: string,
    displayName: string,
  ) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(admin.accessToken))
      .send({
        email,
        password: 'ChangeMe123!',
        displayName,
        status: 'ACTIVE',
      })
      .expect(201);

    return response.body.data.id as string;
  };

  it('runs owner/admin/member lifecycle: view, manage, last-owner protection, and leave', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    const ownerId = await createActiveUser(
      admin,
      'org-owner@example.local',
      'Org Owner',
    );
    const ownerSession = await loginAs(
      app,
      'org-owner@example.local',
      'ChangeMe123!',
    );

    const adminMemberId = await createActiveUser(
      admin,
      'org-admin-member@example.local',
      'Org Admin Member',
    );
    const memberId = await createActiveUser(
      admin,
      'org-plain-member@example.local',
      'Org Plain Member',
    );

    // Owner creates the organization.
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set(bearer(ownerSession.accessToken))
      .send({ name: 'Rocket Org' })
      .expect(201);

    const organizationId = createResponse.body.data.id as string;

    await database.insert(organizationMembers).values([
      { organizationId, userId: adminMemberId, role: 'ADMIN' },
      { organizationId, userId: memberId, role: 'MEMBER' },
    ]);

    // GET /organizations/:id
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/v1/organizations/${organizationId}`)
      .set(bearer(ownerSession.accessToken))
      .expect(200);

    expect(detailResponse.body.data).toMatchObject({
      id: organizationId,
      name: 'Rocket Org',
      role: 'OWNER',
      memberCount: 3,
    });

    // A non-member cannot view the organization.
    const outsiderId = await createActiveUser(
      admin,
      'org-outsider@example.local',
      'Org Outsider',
    );
    const outsiderSession = await loginAs(
      app,
      'org-outsider@example.local',
      'ChangeMe123!',
    );
    await request(app.getHttpServer())
      .get(`/api/v1/organizations/${organizationId}`)
      .set(bearer(outsiderSession.accessToken))
      .expect(403);
    void outsiderId;

    // PATCH /organizations/:id renames the org.
    const renameResponse = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}`)
      .set(bearer(ownerSession.accessToken))
      .send({ name: 'Renamed Rocket Org' })
      .expect(200);
    expect(renameResponse.body.data.name).toBe('Renamed Rocket Org');

    // A plain member cannot rename the organization.
    const memberSession = await loginAs(
      app,
      'org-plain-member@example.local',
      'ChangeMe123!',
    );
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}`)
      .set(bearer(memberSession.accessToken))
      .send({ name: 'Hijacked Org' })
      .expect(403);

    // GET /organizations/:id/members
    const membersResponse = await request(app.getHttpServer())
      .get(`/api/v1/organizations/${organizationId}/members`)
      .set(bearer(ownerSession.accessToken))
      .expect(200);
    expect(membersResponse.body.data).toHaveLength(3);

    // An admin cannot promote a member to admin (only an owner can).
    const adminSession = await loginAs(
      app,
      'org-admin-member@example.local',
      'ChangeMe123!',
    );
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}/members/${memberId}`)
      .set(bearer(adminSession.accessToken))
      .send({ role: 'ADMIN' })
      .expect(403);

    // The owner can promote the member to admin.
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}/members/${memberId}`)
      .set(bearer(ownerSession.accessToken))
      .send({ role: 'ADMIN' })
      .expect(200);

    // The owner is the only owner: leaving must be blocked.
    const leaveResponse = await request(app.getHttpServer())
      .post(`/api/v1/organizations/${organizationId}/leave`)
      .set(bearer(ownerSession.accessToken))
      .send({});
    expect(leaveResponse.status).toBe(409);
    expect(leaveResponse.body.error.code).toBe(
      ERROR_CODES.ORGANIZATION_LAST_OWNER,
    );

    // Promote the original admin member to co-owner, then the first owner can leave.
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}/members/${adminMemberId}`)
      .set(bearer(ownerSession.accessToken))
      .send({ role: 'OWNER' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/organizations/${organizationId}/leave`)
      .set(bearer(ownerSession.accessToken))
      .send({})
      .expect(201);

    // DELETE /organizations/:id/members/:userId removes a member.
    const coOwnerSession = await loginAs(
      app,
      'org-admin-member@example.local',
      'ChangeMe123!',
    );
    await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${organizationId}/members/${memberId}`)
      .set(bearer(coOwnerSession.accessToken))
      .expect(200);

    const membersAfterRemoval = await request(app.getHttpServer())
      .get(`/api/v1/organizations/${organizationId}/members`)
      .set(bearer(coOwnerSession.accessToken))
      .expect(200);
    expect(membersAfterRemoval.body.data).toHaveLength(1);

    // DELETE /organizations/:id soft-deletes the organization.
    await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${organizationId}`)
      .set(bearer(coOwnerSession.accessToken))
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/organizations/${organizationId}`)
      .set(bearer(coOwnerSession.accessToken))
      .expect(404);
  });
});
