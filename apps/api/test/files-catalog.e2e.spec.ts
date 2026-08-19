import type { INestApplication } from "@nestjs/common";

import { DATABASE, users } from "@repo/api-database";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bearer, createTestApp, loginAs, resetTestDatabase } from "./support/test-app";

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("Files catalog, versioning, and batch operations (e2e)", () => {
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

  const uploadFile = async (
    accessToken: string,
    filename: string,
    content: Buffer = PNG_HEADER,
  ) => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/files")
      .set(bearer(accessToken))
      .attach("file", content, filename)
      .expect(201);

    return response.body.data as { id: string; checksum: string; latestVersion: number };
  };

  it("lists and searches the org-scoped file catalog with pagination", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const marker = `catalog-search-${Date.now()}.png`;
    await uploadFile(admin.accessToken, marker);

    const found = await request(app.getHttpServer())
      .get("/api/v1/files")
      .query({ search: marker })
      .set(bearer(admin.accessToken))
      .expect(200);

    expect(found.body.data).toHaveLength(1);
    expect(found.body.data[0].originalName).toBe(marker);
    expect(found.body.meta.total).toBe(1);

    const noMatch = await request(app.getHttpServer())
      .get("/api/v1/files")
      .query({ search: "no-such-file-exists" })
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(noMatch.body.data).toHaveLength(0);
  });

  it("keeps the file catalog isolated per organization", async () => {
    const superAdmin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const seededUser = await loginAs(app, "user@example.local", "ChangeMe123!");
    const superAdminMe = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(superAdmin.accessToken))
      .expect(200);
    const seededUserMe = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(seededUser.accessToken))
      .expect(200);
    const organizationAId = superAdminMe.body.data.organizationId as string;
    const organizationBId = seededUserMe.body.data.organizationId as string;

    // The users API assigns roles by uuid (roleId), so resolve the org-scoped
    // ADMIN role for each organization first.
    const rolesResponse = await request(app.getHttpServer())
      .get("/api/v1/admin/roles")
      .set(bearer(superAdmin.accessToken))
      .expect(200);
    const roles = rolesResponse.body.data as {
      id: string;
      name: string;
      organizationId: string | null;
    }[];
    const adminRoleA = roles.find(
      (role) => role.name === "ADMIN" && role.organizationId === organizationAId,
    );
    const adminRoleB = roles.find(
      (role) => role.name === "ADMIN" && role.organizationId === organizationBId,
    );
    expect(adminRoleA).toBeDefined();
    expect(adminRoleB).toBeDefined();

    const createOrgAdmin = async (
      email: string,
      displayName: string,
      roleId: string,
      organizationId: string,
    ) => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/admin/users")
        .set(bearer(superAdmin.accessToken))
        .send({
          email,
          password: "OrgAdminPass123!",
          displayName,
          status: "ACTIVE",
          roleId,
          organizationId,
        })
        .expect(201);

      const userId = response.body.data.id as string;

      // Admin-created users must change their password on first login; the
      // file isolation flow is unrelated to that gate, so clear it.
      await app
        .get(DATABASE)
        .update(users)
        .set({ mustChangePassword: false })
        .where(eq(users.id, userId));
    };

    await createOrgAdmin(
      "files-org-admin-a@example.local",
      "Files Org Admin A",
      adminRoleA!.id,
      organizationAId,
    );
    await createOrgAdmin(
      "files-org-admin-b@example.local",
      "Files Org Admin B",
      adminRoleB!.id,
      organizationBId,
    );

    const orgAdminB = await loginAs(app, "files-org-admin-b@example.local", "OrgAdminPass123!");
    const orgAdminA = await loginAs(app, "files-org-admin-a@example.local", "OrgAdminPass123!");

    const secretName = "org-b-confidential.png";
    await uploadFile(orgAdminB.accessToken, secretName);

    const listAsOrgA = await request(app.getHttpServer())
      .get("/api/v1/files")
      .query({ search: secretName })
      .set(bearer(orgAdminA.accessToken))
      .expect(200);

    expect(listAsOrgA.body.data).toHaveLength(0);
  });

  it("uploads new versions, keeps history, and exposes the version list", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const filename = `versioned-${Date.now()}.png`;
    const uploaded = await uploadFile(admin.accessToken, filename);

    expect(uploaded.latestVersion).toBe(1);
    const firstChecksum = uploaded.checksum;

    const secondContent = Buffer.concat([PNG_HEADER, Buffer.from([0x01])]);
    const versionResponse = await request(app.getHttpServer())
      .post(`/api/v1/files/${uploaded.id}/versions`)
      .set(bearer(admin.accessToken))
      .attach("file", secondContent, filename)
      .expect(201);

    expect(versionResponse.body.data.latestVersion).toBe(2);
    expect(versionResponse.body.data.checksum).not.toBe(firstChecksum);

    const versions = await request(app.getHttpServer())
      .get(`/api/v1/files/${uploaded.id}/versions`)
      .set(bearer(admin.accessToken))
      .expect(200);

    expect(versions.body.data).toHaveLength(2);
    expect(versions.body.data.map((v: { versionNumber: number }) => v.versionNumber)).toEqual([
      2, 1,
    ]);
    expect(versions.body.data[1].checksum).toBe(firstChecksum);

    const history = await request(app.getHttpServer())
      .get(`/api/v1/files/${uploaded.id}/history`)
      .set(bearer(admin.accessToken))
      .expect(200);

    const actions = history.body.data.map((event: { action: string }) => event.action);
    expect(actions).toContain("file.uploaded");
    expect(actions).toContain("file.version_uploaded");
  });

  it("batch-deletes files, reports partial failures, and replays results via idempotency key", async () => {
    const admin = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const fileA = await uploadFile(admin.accessToken, `batch-a-${Date.now()}.png`);
    const fileB = await uploadFile(admin.accessToken, `batch-b-${Date.now()}.png`);
    const missingId = "00000000-0000-0000-0000-000000000000";
    const idempotencyKey = `batch-${Date.now()}`;

    const firstAttempt = await request(app.getHttpServer())
      .post("/api/v1/files/batch-delete")
      .set(bearer(admin.accessToken))
      .send({ fileIds: [fileA.id, fileB.id, missingId], idempotencyKey })
      .expect(201);

    const resultsByFileId = Object.fromEntries(
      firstAttempt.body.data.results.map((item: { fileId: string; success: boolean }) => [
        item.fileId,
        item.success,
      ]),
    );
    expect(resultsByFileId[fileA.id]).toBe(true);
    expect(resultsByFileId[fileB.id]).toBe(true);
    expect(resultsByFileId[missingId]).toBe(false);

    await request(app.getHttpServer())
      .get(`/api/v1/files/${fileA.id}`)
      .set(bearer(admin.accessToken))
      .expect(404);

    const replay = await request(app.getHttpServer())
      .post("/api/v1/files/batch-delete")
      .set(bearer(admin.accessToken))
      .send({ fileIds: [fileA.id, fileB.id, missingId], idempotencyKey })
      .expect(201);

    expect(replay.body.data.results).toEqual(firstAttempt.body.data.results);
  });
});
