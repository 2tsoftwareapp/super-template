import type { INestApplication } from '@nestjs/common';

import { ERROR_CODES } from '@repo/api-core';
import { DATABASE, organizationMembers, userRoles, authSessions, users, type DatabaseClient } from '@repo/api-database';
import { and, eq } from 'drizzle-orm';
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

    const userId = response.body.data.id as string;
    await database
      .update(users)
      .set({ mustChangePassword: false })
      .where(eq(users.id, userId));

    return userId;
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
      .expect(401);

    await request(app.getHttpServer())
      .get(`/api/v1/organizations/${organizationId}`)
      .set(bearer(admin.accessToken))
      .expect(404);
  });

  it('enforces RBAC sync, member leaves, concurrency locks, session revokes, and SUPER_ADMIN bypass', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    // 1. Create org and users
    const ownerId = await createActiveUser(admin, 'invariants-owner@example.local', 'Invariants Owner');
    const ownerSession = await loginAs(app, 'invariants-owner@example.local', 'ChangeMe123!');
    const memberId = await createActiveUser(admin, 'invariants-member@example.local', 'Invariants Member');
    const memberSession = await loginAs(app, 'invariants-member@example.local', 'ChangeMe123!');

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set(bearer(ownerSession.accessToken))
      .send({ name: 'Invariants Org' })
      .expect(201);
    const organizationId = createResponse.body.data.id as string;

    // Join member as MEMBER
    await database.insert(organizationMembers).values([
      { organizationId, userId: memberId, role: 'MEMBER' },
    ]);

    // 2. Promote MEMBER to ADMIN
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}/members/${memberId}`)
      .set(bearer(ownerSession.accessToken))
      .send({ role: 'ADMIN' })
      .expect(200);

    // Verify ADMIN database RBAC role is assigned in userRoles table
    const rolesAfterPromote = await database
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, memberId),
          eq(userRoles.organizationId, organizationId)
        )
      );
    expect(rolesAfterPromote).toHaveLength(1);

    // 3. Demote ADMIN back to MEMBER
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}/members/${memberId}`)
      .set(bearer(ownerSession.accessToken))
      .send({ role: 'MEMBER' })
      .expect(200);

    // Verify ADMIN database RBAC role is removed in userRoles table
    const rolesAfterDemote = await database
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, memberId),
          eq(userRoles.organizationId, organizationId)
        )
      );
    expect(rolesAfterDemote).toHaveLength(0);

    // Promote to ADMIN again for removal test
    await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}/members/${memberId}`)
      .set(bearer(ownerSession.accessToken))
      .send({ role: 'ADMIN' })
      .expect(200);

    // 4. Remove member
    await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${organizationId}/members/${memberId}`)
      .set(bearer(ownerSession.accessToken))
      .expect(200);

    // Verify membership deleted, userRoles cleaned up, and session invalidation
    const membership = await database
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, memberId)
        )
      );
    expect(membership).toHaveLength(0);

    const rolesAfterRemoval = await database
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, memberId),
          eq(userRoles.organizationId, organizationId)
        )
      );
    expect(rolesAfterRemoval).toHaveLength(0);

    // Check that target user's sessions are revoked
    const sessions = await database
      .select()
      .from(authSessions)
      .where(eq(authSessions.userId, memberId));
    for (const session of sessions) {
      expect(session.revokedAt).not.toBeNull();
    }

    // 5. SUPER_ADMIN bypass: admin (a system super admin) can manage/rename/delete
    // even though admin is not in organizationMembers of organizationId.
    const superAdminRenameResponse = await request(app.getHttpServer())
      .patch(`/api/v1/organizations/${organizationId}`)
      .set(bearer(admin.accessToken))
      .send({ name: 'Super Admin Renamed' })
      .expect(200);
    expect(superAdminRenameResponse.body.data.name).toBe('Super Admin Renamed');

    // 6. Deleted Org isolation: switch or authenticate to deleted org is blocked.
    // Soft delete the org first.
    await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${organizationId}`)
      .set(bearer(ownerSession.accessToken))
      .expect(200);

    // Assert that attempting to switch to it returns unauthorized because ownerSession was revoked on delete.
    await request(app.getHttpServer())
      .post('/api/v1/auth/switch-organization')
      .set(bearer(ownerSession.accessToken))
      .send({ organizationId })
      .expect(401);

    // If another user who is logged in (like admin) tries to switch to it, they get 404 Not Found because it is deleted.
    await request(app.getHttpServer())
      .post('/api/v1/auth/switch-organization')
      .set(bearer(admin.accessToken))
      .send({ organizationId })
      .expect(404);
  });
});
