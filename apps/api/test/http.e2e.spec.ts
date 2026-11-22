import type { INestApplication } from "@nestjs/common";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ADMIN_ID, createTestApp, signToken } from "./support";

describe("http surface (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers an unknown route with a stable 404 code and no framework message", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/nope")
      .set("authorization", `Bearer ${signToken(ADMIN_ID)}`)
      .expect(404);

    expect(response.body.error).toEqual({ code: "ROUTE_NOT_FOUND", message: "Route not found" });
  });

  it("rejects malformed JSON as a validation failure, not a 500", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .set("content-type", "application/json")
      .send("{not json")
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects properties a DTO does not declare", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@example.local", password: "ChangeMe123!", role: "ADMIN" })
      .expect(400);

    expect(response.body.error.message).toContain("property role should not exist");
  });
});
