import type { INestApplication } from "@nestjs/common";

import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTestApp, resetTestDatabase } from "./support/test-app";

const throttlingEnvironment = {
  THROTTLER_ENABLED_IN_TEST: "true",
  THROTTLER_LIMIT: "2",
  THROTTLER_TTL_MS: "60000",
  // Use an explicit opt-in for Redis so local runs exercise the no-Redis
  // fallback deterministically instead of inheriting stale shared buckets.
  REDIS_URL: process.env.THROTTLER_TEST_REDIS_URL ?? "",
};

const previousEnvironment = new Map<string, string | undefined>();

const restoreEnvironment = (): void => {
  for (const [key, value] of previousEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
};

describe("Global throttling (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    for (const [key, value] of Object.entries(throttlingEnvironment)) {
      previousEnvironment.set(key, process.env[key]);
      process.env[key] = value;
    }
    await resetTestDatabase();
    app = await createTestApp({ overrideThrottler: false });
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    restoreEnvironment();
  }, 30_000);

  it("returns 429 after the configured anonymous request limit", async () => {
    const http = request(app.getHttpServer());

    await http.get("/api/v1/health").expect(200);
    await http.get("/api/v1/health").expect(200);
    const blocked = await http.get("/api/v1/health").expect(429);

    expect(blocked.body.error.message).toContain("Too Many Requests");
  });
});
