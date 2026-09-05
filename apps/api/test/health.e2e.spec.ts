import type { INestApplication } from "@nestjs/common";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestApp, resetTestDatabase } from "./support/test-app";

describe("HealthController (e2e)", () => {
  let app: INestApplication;
  let previousRedisUrl: string | undefined;

  beforeAll(async () => {
    // Assert Postgres readiness only. Clear REDIS_URL so Terminus does not hang
    // on node-redis connect (no connectTimeout in createRedisClient).
    previousRedisUrl = process.env.REDIS_URL;
    delete process.env.REDIS_URL;

    await resetTestDatabase();
    app = await createTestApp();
  }, 120_000);

  afterAll(async () => {
    if (previousRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = previousRedisUrl;
    }
    if (app) {
      await app.close();
    }
  }, 30_000);

  it("returns the liveness payload", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/health").expect(200);

    expect(response.body).toMatchObject({
      data: { status: "ok" },
      meta: { requestId: expect.any(String) },
    });
    // Test env has no warnings; the array must still be present for monitoring.
    expect(response.body.data.warnings).toEqual([]);
  });

  it("returns the readiness payload when postgres is reachable", async () => {
    const response = await request(app.getHttpServer()).get("/api/v1/health/ready").expect(200);

    expect(response.body).toMatchObject({
      data: { status: "ready" },
      meta: { requestId: expect.any(String) },
    });
    expect(response.body.data.warnings).toEqual([]);
  });
});
