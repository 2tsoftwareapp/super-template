import type { INestApplication } from "@nestjs/common";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bearer, createTestApp, loginAs, resetTestDatabase } from "./support/test-app";

describe("Maintenance mode (e2e)", () => {
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

  const setMaintenanceMode = async (token: string, enabled: boolean) => {
    await request(app.getHttpServer())
      .patch("/api/v1/admin/settings/maintenance_mode")
      .set(bearer(token))
      .send({ value: { enabled } })
      .expect(200);
  };

  it("serves requests normally while maintenance mode is off", async () => {
    const session = await loginAs(app, "admin@example.local", "ChangeMe123!");

    const response = await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set(bearer(session.accessToken))
      .expect(200);

    expect(response.body.data).toMatchObject({ id: session.userId });
  });

  it("blocks non-exempt requests with 503 while maintenance is on and recovers after it is turned off", async () => {
    const session = await loginAs(app, "admin@example.local", "ChangeMe123!");

    await setMaintenanceMode(session.accessToken, true);

    // Authenticated request to a protected route is rejected before auth runs.
    const blocked = await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set(bearer(session.accessToken))
      .expect(503);

    expect(blocked.body).toMatchObject({
      error: { code: "SERVICE_UNAVAILABLE" },
      meta: { requestId: expect.any(String) },
    });

    // Public non-exempt routes are blocked too.
    await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: "new-user@example.local",
        password: "ChangeMe123!",
        displayName: "New User",
      })
      .expect(503);

    // Exempt routes stay reachable: health probes, login, and settings.
    await request(app.getHttpServer()).get("/api/v1/health").expect(200);
    await loginAs(app, "user@example.local", "ChangeMe123!");
    await request(app.getHttpServer())
      .get("/api/v1/admin/settings")
      .set(bearer(session.accessToken))
      .expect(200);

    // Turn maintenance off from the (exempt) settings endpoint.
    await setMaintenanceMode(session.accessToken, false);

    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set(bearer(session.accessToken))
      .expect(200);
  });
});
