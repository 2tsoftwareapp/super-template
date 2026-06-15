import type { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ERROR_CODES } from '../src/common/constants/error-codes';
import { DATABASE } from '../src/database/database.provider';
import type { DatabaseClient } from '../src/database/database.types';
import { auditLogs } from '../src/database/schema';
import { ROLE_NAMES } from '../src/modules/access-control/access-control.constants';
import { AccessControlService } from '../src/modules/access-control/application/access-control.service';
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
        userId: targetUserId,
        type: 'ops.alert',
        title: 'Ops alert',
        body: 'Restricted notification',
      })
      .expect(201);

    const targetNotificationId = sendNotificationResponse.body.data
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
});
