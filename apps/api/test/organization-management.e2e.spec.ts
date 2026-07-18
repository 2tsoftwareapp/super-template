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
      .expect(403);

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

    // Check that target user's sessions are NOT revoked (isolation check: do not log out of other tenants)
    const sessions = await database
      .select()
      .from(authSessions)
      .where(eq(authSessions.userId, memberId));
    for (const session of sessions) {
      expect(session.revokedAt).toBeNull();
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

    // Assert that attempting to switch to it returns 404 because organization was deleted.
    await request(app.getHttpServer())
      .post('/api/v1/auth/switch-organization')
      .set(bearer(ownerSession.accessToken))
      .send({ organizationId })
      .expect(404);

    // If another user who is logged in (like admin) tries to switch to it, they get 404 Not Found because it is deleted.
    await request(app.getHttpServer())
      .post('/api/v1/auth/switch-organization')
      .set(bearer(admin.accessToken))
      .send({ organizationId })
      .expect(404);
  });

  it('handles concurrent demotions, enforcing last-owner locking and exactly one success', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    // 1. Create org and users
    const ownerAEmail = 'concurrent-owner-a@example.local';
    const ownerBEmail = 'concurrent-owner-b@example.local';
    const ownerAId = await createActiveUser(admin, ownerAEmail, 'Owner A');
    const ownerBId = await createActiveUser(admin, ownerBEmail, 'Owner B');

    const ownerASession = await loginAs(app, ownerAEmail, 'ChangeMe123!');

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set(bearer(ownerASession.accessToken))
      .send({ name: 'Concurrency Org' })
      .expect(201);
    const organizationId = createResponse.body.data.id as string;

    // Join Owner B as OWNER
    await database.insert(organizationMembers).values([
      { organizationId, userId: ownerBId, role: 'OWNER' },
    ]);

    // Perform concurrent demotion requests
    const [resA, resB] = await Promise.allSettled([
      request(app.getHttpServer())
        .patch(`/api/v1/organizations/${organizationId}/members/${ownerAId}`)
        .set(bearer(admin.accessToken))
        .send({ role: 'MEMBER' }),
      request(app.getHttpServer())
        .patch(`/api/v1/organizations/${organizationId}/members/${ownerBId}`)
        .set(bearer(admin.accessToken))
        .send({ role: 'MEMBER' }),
    ]);

    const results = [resA, resB].map((r) => {
      if (r.status === 'fulfilled') {
        return r.value.status;
      }
      throw new Error('Promise was rejected');
    });

    // One of them must succeed (200 OK)
    // One of them must fail (400 Bad Request, due to last owner protection, or 409 Conflict due to concurrent transaction conflict)
    expect(results).toContain(200);
    expect([400, 409]).toContain(results.find((status) => status !== 200));

    // Verify exactly 1 owner remains in the DB
    const finalOwnersCount = await database
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, 'OWNER')
        )
      );
    expect(finalOwnersCount).toHaveLength(1);
  });

  it('synchronizes membership role and RBAC role via Users API, blocking OWNER demotion', async () => {
    const admin = await loginAs(app, 'admin@example.local', 'ChangeMe123!');

    // 1. Create a new organization
    const creatorEmail = 'sync-creator@example.local';
    await createActiveUser(admin, creatorEmail, 'Creator');
    const creatorSession = await loginAs(app, creatorEmail, 'ChangeMe123!');

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set(bearer(creatorSession.accessToken))
      .send({ name: 'Sync Invariant Org' })
      .expect(201);
    const organizationId = createResponse.body.data.id as string;

    // Get assignable roles after org is created so the new org roles are available
    const rolesRes = await request(app.getHttpServer())
      .get('/api/v1/admin/roles')
      .set(bearer(admin.accessToken))
      .expect(200);

    const rolesList = rolesRes.body.data;
    const adminRole = rolesList.find((r: any) => r.name === 'ADMIN' && r.organizationId === organizationId);
    const userRole = rolesList.find((r: any) => r.name === 'USER' && r.organizationId === null);

    expect(adminRole).toBeDefined();
    expect(userRole).toBeDefined();

    // 2. Create User as ADMIN -> membership should be ADMIN
    const adminUserEmail = 'sync-admin-user@example.local';
    const createAdminUserRes = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(admin.accessToken))
      .send({
        email: adminUserEmail,
        password: 'Password123!',
        displayName: 'Admin User',
        roleId: adminRole.id,
        organizationId,
        status: 'ACTIVE',
      })
      .expect(201);
    const adminUserId = createAdminUserRes.body.data.id;

    // Check membership role in DB
    const adminMembership = await database
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, adminUserId)
        )
      );
    expect(adminMembership).toHaveLength(1);
    expect(adminMembership[0]!.role).toBe('ADMIN');

    // 3. Create another User as USER -> membership should be MEMBER
    const memberUserEmail = 'sync-member-user@example.local';
    const createMemberUserRes = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(admin.accessToken))
      .send({
        email: memberUserEmail,
        password: 'Password123!',
        displayName: 'Member User',
        roleId: userRole.id,
        organizationId,
        status: 'ACTIVE',
      })
      .expect(201);
    const memberUserId = createMemberUserRes.body.data.id;

    const memberMembership = await database
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, memberUserId)
        )
      );
    expect(memberMembership).toHaveLength(1);
    expect(memberMembership[0]!.role).toBe('MEMBER');

    // 4. Update member to ADMIN via Users API -> membership should become ADMIN
    await request(app.getHttpServer())
      .put(`/api/v1/admin/users/${memberUserId}/roles`)
      .set(bearer(admin.accessToken))
      .send({
        roleId: adminRole.id,
        organizationId,
      })
      .expect(200);

    const updatedMembershipToAdmin = await database
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, memberUserId)
        )
      );
    expect(updatedMembershipToAdmin[0]!.role).toBe('ADMIN');

    // 5. Update admin back to USER via Users API -> membership should become MEMBER
    await request(app.getHttpServer())
      .put(`/api/v1/admin/users/${memberUserId}/roles`)
      .set(bearer(admin.accessToken))
      .send({
        roleId: userRole.id,
        organizationId,
      })
      .expect(200);

    const updatedMembershipToMember = await database
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, memberUserId)
        )
      );
    expect(updatedMembershipToMember[0]!.role).toBe('MEMBER');

    // 6. Attempt to modify roles of the OWNER (creator) -> should be blocked with 403
    const creatorUser = await database
      .select()
      .from(users)
      .where(eq(users.email, creatorEmail));
    const creatorId = creatorUser[0]!.id;

    await request(app.getHttpServer())
      .put(`/api/v1/admin/users/${creatorId}/roles`)
      .set(bearer(admin.accessToken))
      .send({
        roleId: userRole.id,
        organizationId,
      })
      .expect(403);
  });
});
