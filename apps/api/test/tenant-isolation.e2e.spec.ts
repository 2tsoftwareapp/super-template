import type { INestApplication } from "@nestjs/common";
import { ROLE_NAMES } from "@repo/api-core";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  bearer,
  createTestApp,
  getCurrentDatabaseUser,
  getTestAppRoleName,
  loginAs,
  resetTestDatabase,
} from "./support/test-app";

describe("Tenant isolation (e2e)", () => {
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

  it("keeps notification inboxes scoped to the authenticated user", async () => {
    const adminSession = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const userSession = await loginAs(app, "user@example.local", "ChangeMe123!");

    const adminInbox = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set(bearer(adminSession.accessToken))
      .expect(200);

    const userInbox = await request(app.getHttpServer())
      .get("/api/v1/notifications")
      .set(bearer(userSession.accessToken))
      .expect(200);

    const userTitles = userInbox.body.data.map(
      (notification: { title: string }) => notification.title,
    );

    expect(userTitles).toContain("Welcome to the starter");
    expect(adminInbox.body.data).toEqual([]);
  });

  it("runs tenant-scoped queries under the restricted test role", async () => {
    expect(await getCurrentDatabaseUser(app)).toBe(getTestAppRoleName());
  });

  it("lists organizations for the authenticated user", async () => {
    const userSession = await loginAs(app, "user@example.local", "ChangeMe123!");

    const response = await request(app.getHttpServer())
      .get("/api/v1/organizations")
      .set(bearer(userSession.accessToken))
      .expect(200);

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toMatchObject({
      current: true,
      role: "OWNER",
    });
  });

  it("prevents an org-scoped ADMIN from reading users in another organization", async () => {
    const superAdminSession = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const seededUserSession = await loginAs(app, "user@example.local", "ChangeMe123!");
    const superAdminMe = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(superAdminSession.accessToken))
      .expect(200);
    const seededUserMe = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(seededUserSession.accessToken))
      .expect(200);
    const organizationAId = superAdminMe.body.data.organizationId as string;
    const organizationBId = seededUserMe.body.data.organizationId as string;

    const rolesResponse = await request(app.getHttpServer())
      .get("/api/v1/admin/roles")
      .set(bearer(superAdminSession.accessToken))
      .expect(200);
    const adminRoleId = rolesResponse.body.data.find(
      (r: any) => r.name === "ADMIN" && r.organizationId === null,
    )?.id;

    const orgAdminA = await request(app.getHttpServer())
      .post("/api/v1/admin/users")
      .set(bearer(superAdminSession.accessToken))
      .send({
        email: "org-admin-a@example.local",
        password: "OrgAdminPass123!",
        displayName: "Org Admin A",
        status: "ACTIVE",
        roleId: adminRoleId,
        organizationId: organizationAId,
      })
      .expect(201);

    const orgAdminB = await request(app.getHttpServer())
      .post("/api/v1/admin/users")
      .set(bearer(superAdminSession.accessToken))
      .send({
        email: "org-admin-b@example.local",
        password: "OrgAdminPass123!",
        displayName: "Org Admin B",
        status: "ACTIVE",
        roleId: adminRoleId,
        organizationId: organizationBId,
      })
      .expect(201);

    const orgAdminAInitialSession = await loginAs(
      app,
      "org-admin-a@example.local",
      "OrgAdminPass123!",
    );

    await request(app.getHttpServer())
      .patch("/api/v1/users/me/password")
      .set(bearer(orgAdminAInitialSession.accessToken))
      .send({ currentPassword: "OrgAdminPass123!", newPassword: "NewPassword123!" })
      .expect(200);

    const orgAdminASession = await loginAs(app, "org-admin-a@example.local", "NewPassword123!");

    const listResponse = await request(app.getHttpServer())
      .get("/api/v1/admin/users")
      .set(bearer(orgAdminASession.accessToken))
      .set("x-organization-id", organizationAId)
      .expect(200);

    const visibleEmails = listResponse.body.data.map((user: { email: string }) => user.email);

    expect(visibleEmails).not.toContain("org-admin-b@example.local");

    const forbiddenRead = await request(app.getHttpServer())
      .get(`/api/v1/admin/users/${orgAdminB.body.data.id}`)
      .set(bearer(orgAdminASession.accessToken))
      .expect(403);

    expect(forbiddenRead.body.error.code).toBe("AUTH_FORBIDDEN");

    expect(orgAdminA.body.data.roles).toEqual(expect.arrayContaining([ROLE_NAMES.ADMIN]));
    expect(orgAdminB.body.data.roles).toEqual(expect.arrayContaining([ROLE_NAMES.ADMIN]));
  });
});
