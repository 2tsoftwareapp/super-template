import type { INestApplication } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core';
import { auditLogs, DATABASE, type DatabaseClient } from '@repo/api-database';
import { AccessControlService, ROLE_NAMES } from '@repo/api-identity';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  bearer,
  createTestApp,
  loginAs,
  resetTestDatabase,
} from './support/test-app';

describe('Auth, Projects, and Notifications (e2e)', () => {
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

  it('rotates refresh tokens and revokes the session when the previous refresh token is reused', async () => {
    const session = await loginAs(app, 'user@example.local', 'ChangeMe123!');

    const sessionsResponse = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set(bearer(session.accessToken))
      .expect(200);

    expect(sessionsResponse.body.data).toHaveLength(1);
    expect(sessionsResponse.body.data[0]).toMatchObject({
      id: session.sessionId,
      current: true,
    });

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: session.refreshToken })
      .expect(201);

    expect(refreshResponse.body.data.refreshToken).not.toBe(
      session.refreshToken,
    );
    expect(refreshResponse.body.data.session.id).toBe(session.sessionId);

    const reusedResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: session.refreshToken })
      .expect(401);

    expect(reusedResponse.body.error.code).toBe(
      ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
    );

    const meAfterReuse = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(bearer(refreshResponse.body.data.accessToken))
      .expect(401);

    expect(meAfterReuse.body.error.code).toBe(ERROR_CODES.AUTH_SESSION_REVOKED);
  });

  it('logout-all revokes every active session for the current user', async () => {
    const firstSession = await loginAs(
      app,
      'user@example.local',
      'ChangeMe123!',
    );
    const secondSession = await loginAs(
      app,
      'user@example.local',
      'ChangeMe123!',
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .set(bearer(firstSession.accessToken))
      .expect(201);

    const refreshAfterLogoutAll = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: secondSession.refreshToken })
      .expect(401);

    expect(refreshAfterLogoutAll.body.error.code).toBe(
      ERROR_CODES.AUTH_SESSION_REVOKED,
    );
  });

  it('creates assignment notifications and prevents unrelated users from reading the project', async () => {
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
    const accessControlService = app.get(AccessControlService);
    const userRole = await accessControlService.getRoleByName(ROLE_NAMES.USER);

    expect(userRole).toBeDefined();

    if (!userRole) {
      throw new Error('USER role was not found');
    }

    await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(adminSession.accessToken))
      .send({
        email: 'viewer@example.local',
        password: 'ViewerPass123!',
        displayName: 'Viewer User',
        status: 'ACTIVE',
        roleIds: [userRole.id],
      })
      .expect(201);

    const viewerSession = await loginAs(
      app,
      'viewer@example.local',
      'ViewerPass123!',
    );

    const createProjectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set(bearer(adminSession.accessToken))
      .send({
        name: 'Assigned Delivery Project',
        status: 'ACTIVE',
        ownerId: userSession.userId,
      })
      .expect(201);

    const projectId = createProjectResponse.body.data.id as string;

    const unreadCountResponse = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .set(bearer(userSession.accessToken))
      .expect(200);

    expect(unreadCountResponse.body.data.count).toBeGreaterThanOrEqual(2);

    const notificationsResponse = await request(app.getHttpServer())
      .get('/api/v1/notifications?type=project.assigned')
      .set(bearer(userSession.accessToken))
      .expect(200);

    expect(notificationsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'project.assigned',
          title: 'Project assigned',
        }),
      ]),
    );

    await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}`)
      .set(bearer(userSession.accessToken))
      .expect(200);

    const forbiddenProjectAccess = await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}`)
      .set(bearer(viewerSession.accessToken))
      .expect(403);

    expect(forbiddenProjectAccess.body.error.code).toBe(
      ERROR_CODES.AUTH_FORBIDDEN,
    );

    const database = app.get<DatabaseClient>(DATABASE);
    const projectAuditRows = await database
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, projectId));

    expect(
      projectAuditRows.some((row) => row.action === 'project.created'),
    ).toBe(true);
  });

  it('restricts notification mutations by ownership and rejects unknown project fields', async () => {
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
    const accessControlService = app.get(AccessControlService);
    const userRole = await accessControlService.getRoleByName(ROLE_NAMES.USER);

    if (!userRole) {
      throw new Error('USER role was not found');
    }

    const createUserResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(adminSession.accessToken))
      .send({
        email: 'notify-owner@example.local',
        password: 'NotifyPass123!',
        displayName: 'Notification Owner',
        status: 'ACTIVE',
        roleIds: [userRole.id],
      })
      .expect(201);

    const targetUserId = createUserResponse.body.data.id as string;

    const sendNotificationResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/notifications')
      .set(bearer(adminSession.accessToken))
      .send({
        audience: 'USER',
        userId: targetUserId,
        type: 'ops.alert',
        title: 'Ops alert',
        body: 'Restricted notification',
      })
      .expect(201);

    expect(sendNotificationResponse.body.data).toMatchObject({
      audience: 'USER',
      status: 'COMPLETED',
      recipientCount: 1,
    });

    const targetUserSession = await loginAs(
      app,
      'notify-owner@example.local',
      'NotifyPass123!',
    );

    const targetNotificationsResponse = await request(app.getHttpServer())
      .get('/api/v1/notifications?type=ops.alert')
      .set(bearer(targetUserSession.accessToken))
      .expect(200);

    const targetNotificationId = targetNotificationsResponse.body.data[0]
      .id as string;

    const foreignMutation = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${targetNotificationId}/read`)
      .set(bearer(userSession.accessToken))
      .expect(404);

    expect(foreignMutation.body.error.code).toBe(
      ERROR_CODES.NOTIFICATION_NOT_FOUND,
    );

    const validationResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set(bearer(userSession.accessToken))
      .send({
        name: 'Bad payload project',
        rogueField: 'not-allowed',
      })
      .expect(400);

    expect(validationResponse.body.error.code).toBe(
      ERROR_CODES.VALIDATION_FAILED,
    );
  });

  it('supports multi-user, broadcast, and scheduled notification jobs', async () => {
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
    const accessControlService = app.get(AccessControlService);
    const userRole = await accessControlService.getRoleByName(ROLE_NAMES.USER);

    if (!userRole) {
      throw new Error('USER role was not found');
    }

    const secondUserResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(adminSession.accessToken))
      .send({
        email: 'notify-peer@example.local',
        password: 'NotifyPass123!',
        displayName: 'Notify Peer',
        status: 'ACTIVE',
        roleIds: [userRole.id],
      })
      .expect(201);

    const multiSendResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/notifications')
      .set(bearer(adminSession.accessToken))
      .send({
        audience: 'USERS',
        userIds: [userSession.userId, secondUserResponse.body.data.id],
        type: 'ops.broadcast',
        title: 'Peer alert',
        body: 'Sent to selected users',
      })
      .expect(201);

    expect(multiSendResponse.body.data).toMatchObject({
      audience: 'USERS',
      status: 'COMPLETED',
      recipientCount: 2,
    });

    const broadcastResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/notifications')
      .set(bearer(adminSession.accessToken))
      .send({
        audience: 'ALL',
        type: 'ops.broadcast',
        title: 'Everyone alert',
        body: 'Sent to all active users',
      })
      .expect(201);

    expect(broadcastResponse.body.data.status).toBe('COMPLETED');
    expect(broadcastResponse.body.data.recipientCount).toBeGreaterThanOrEqual(
      3,
    );

    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const scheduledResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/notifications')
      .set(bearer(adminSession.accessToken))
      .send({
        audience: 'USER',
        userId: userSession.userId,
        type: 'ops.scheduled',
        title: 'Scheduled alert',
        body: 'Deliver later',
        scheduledAt,
      })
      .expect(201);

    expect(scheduledResponse.body.data).toMatchObject({
      audience: 'USER',
      status: 'PENDING',
    });

    const jobsResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/notifications/jobs?status=PENDING')
      .set(bearer(adminSession.accessToken))
      .expect(200);

    expect(jobsResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: scheduledResponse.body.data.id,
          status: 'PENDING',
        }),
      ]),
    );

    const cancelResponse = await request(app.getHttpServer())
      .delete(
        `/api/v1/admin/notifications/jobs/${scheduledResponse.body.data.id}`,
      )
      .set(bearer(adminSession.accessToken))
      .expect(200);

    expect(cancelResponse.body.data.status).toBe('CANCELLED');
  });

  it('enforces admin boundaries and revokes active sessions when a user is blocked', async () => {
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

    const forbiddenAdminList = await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set(bearer(userSession.accessToken))
      .expect(403);

    expect(forbiddenAdminList.body.error.code).toBe(ERROR_CODES.AUTH_FORBIDDEN);

    const userList = await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set(bearer(adminSession.accessToken))
      .expect(200);

    const seededUser = userList.body.data.find(
      (candidate: { email: string; id: string }) =>
        candidate.email === 'user@example.local',
    );

    expect(seededUser).toBeDefined();

    if (!seededUser) {
      throw new Error('Seeded regular user was not found in admin list');
    }

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${seededUser.id}/status`)
      .set(bearer(adminSession.accessToken))
      .send({ status: 'BLOCKED' })
      .expect(200);

    const blockedAccess = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(bearer(userSession.accessToken))
      .expect(401);

    expect(blockedAccess.body.error.code).toBe(
      ERROR_CODES.AUTH_SESSION_REVOKED,
    );
  });

  it('defaults new users to USER and prevents admins from managing privileged accounts', async () => {
    const superAdminSession = await loginAs(
      app,
      'admin@example.local',
      'ChangeMe123!',
    );
    const accessControlService = app.get(AccessControlService);
    const adminRole = await accessControlService.getRoleByName(
      ROLE_NAMES.ADMIN,
    );
    const userRole = await accessControlService.getRoleByName(ROLE_NAMES.USER);

    if (!adminRole || !userRole) {
      throw new Error('Required roles were not found');
    }

    const defaultRoleResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(superAdminSession.accessToken))
      .send({
        email: 'default-role@example.local',
        password: 'DefaultPass123!',
        displayName: 'Default Role User',
        status: 'ACTIVE',
      })
      .expect(201);

    expect(defaultRoleResponse.body.data.roles).toEqual(
      expect.arrayContaining([ROLE_NAMES.USER]),
    );

    const managerResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(superAdminSession.accessToken))
      .send({
        email: 'manager@example.local',
        password: 'ManagerPass123!',
        displayName: 'Manager Admin',
        status: 'ACTIVE',
        roleIds: [adminRole.id],
      })
      .expect(201);

    const privilegedTargetResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(superAdminSession.accessToken))
      .send({
        email: 'privileged-target@example.local',
        password: 'PrivilegedPass123!',
        displayName: 'Privileged Target',
        status: 'ACTIVE',
        roleIds: [adminRole.id],
      })
      .expect(201);

    const regularTargetResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(superAdminSession.accessToken))
      .send({
        email: 'regular-target@example.local',
        password: 'RegularPass123!',
        displayName: 'Regular Target',
        status: 'ACTIVE',
        roleIds: [userRole.id],
      })
      .expect(201);

    const managerSession = await loginAs(
      app,
      'manager@example.local',
      'ManagerPass123!',
    );

    await request(app.getHttpServer())
      .post('/api/v1/admin/users')
      .set(bearer(managerSession.accessToken))
      .send({
        email: 'blocked-role@example.local',
        password: 'BlockedRole123!',
        displayName: 'Blocked Role',
        status: 'ACTIVE',
        roleIds: [adminRole.id],
      })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/users/${managerResponse.body.data.id}`)
      .set(bearer(managerSession.accessToken))
      .expect(403);

    await request(app.getHttpServer())
      .patch(
        `/api/v1/admin/users/${privilegedTargetResponse.body.data.id}/status`,
      )
      .set(bearer(managerSession.accessToken))
      .send({ status: 'BLOCKED' })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/users/${regularTargetResponse.body.data.id}`)
      .set(bearer(managerSession.accessToken))
      .expect(200);
  });

  it('prevents users from changing their own roles', async () => {
    const superAdminSession = await loginAs(
      app,
      'admin@example.local',
      'ChangeMe123!',
    );
    const accessControlService = app.get(AccessControlService);
    const userRole = await accessControlService.getRoleByName(ROLE_NAMES.USER);

    if (!userRole) {
      throw new Error('USER role was not found');
    }

    const selfRoleChangeResponse = await request(app.getHttpServer())
      .put(`/api/v1/admin/users/${superAdminSession.userId}/roles`)
      .set(bearer(superAdminSession.accessToken))
      .send({ roleIds: [userRole.id] })
      .expect(403);

    expect(selfRoleChangeResponse.body.error.code).toBe(
      ERROR_CODES.AUTH_FORBIDDEN,
    );
  });

  it('lists audit logs for admins with audit.read permission', async () => {
    const adminSession = await loginAs(
      app,
      'admin@example.local',
      'ChangeMe123!',
    );

    const auditResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .set(bearer(adminSession.accessToken))
      .expect(200);

    expect(auditResponse.body.data).toBeInstanceOf(Array);
    expect(auditResponse.body.meta.total).toBeGreaterThanOrEqual(0);
  });

  it('lists roles for admins with roles.read permission', async () => {
    const adminSession = await loginAs(
      app,
      'admin@example.local',
      'ChangeMe123!',
    );

    const rolesResponse = await request(app.getHttpServer())
      .get('/api/v1/admin/roles')
      .set(bearer(adminSession.accessToken))
      .expect(200);

    expect(rolesResponse.body.data.length).toBeGreaterThan(0);
  });
});
