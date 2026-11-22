import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";

import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  InMemoryAuthRepository,
  MEMBER_ID,
  PASSWORD,
  createTestApp,
  makeUser,
  signToken,
} from "./support";

describe("auth (e2e)", () => {
  let app: INestApplication;
  const auth = new InMemoryAuthRepository();

  beforeAll(async () => {
    app = await createTestApp(undefined, auth);
    // As in main.ts behind the admin BFF: X-Forwarded-For decides request.ip.
    (app as NestExpressApplication).set("trust proxy", true);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const login = (email = "admin@example.local", password = PASSWORD) =>
    request(app.getHttpServer()).post("/api/v1/auth/login").send({ email, password });

  const refresh = (refreshToken: string) =>
    request(app.getHttpServer()).post("/api/v1/auth/refresh").send({ refreshToken });

  it("logs in, reads the profile and rotates the refresh token", async () => {
    const { accessToken, refreshToken } = (await login().expect(200)).body.data;

    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(me.body.data.email).toBe("admin@example.local");

    const refreshed = await refresh(refreshToken).expect(200);
    expect(refreshed.body.data.refreshToken).not.toBe(refreshToken);
  });

  it("rejects a wrong password without revealing which field failed", async () => {
    const response = await login("admin@example.local", "wrong-password").expect(401);

    expect(response.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(response.body.error.message).toBe("Invalid email or password");
  });

  it("lets exactly one of several concurrent refreshes win without logging the user out", async () => {
    const { refreshToken } = (await login().expect(200)).body.data;

    const responses = await Promise.all([
      refresh(refreshToken),
      refresh(refreshToken),
      refresh(refreshToken),
    ]);
    const winners = responses.filter((response) => response.status === 200);
    const losers = responses.filter((response) => response.status !== 200);

    expect(winners).toHaveLength(1);
    expect(losers.map((response) => response.body.error.code)).toEqual([
      "AUTH_SESSION_ROTATED",
      "AUTH_SESSION_ROTATED",
    ]);

    await refresh(winners[0]?.body.data.refreshToken).expect(200);
  });

  it("treats a rotated token replayed after the grace window as theft and revokes every session", async () => {
    const { refreshToken } = (await login().expect(200)).body.data;
    const rotated = (await refresh(refreshToken).expect(200)).body.data.refreshToken;

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 11_000);

    const replay = await refresh(refreshToken).expect(401);
    expect(replay.body.error.code).toBe("AUTH_TOKEN_REUSED");

    await refresh(rotated).expect(401);
  });

  it("logout revokes the refresh token and blocks later refreshes", async () => {
    const { refreshToken } = (await login().expect(200)).body.data;

    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .send({ refreshToken })
      .expect(204);
    await refresh(refreshToken).expect(401);
  });

  it("rejects a still-valid access token once the account is blocked or deleted", async () => {
    const blocked = auth.add(makeUser());
    const token = signToken(blocked.id);
    const me = () =>
      request(app.getHttpServer()).get("/api/v1/auth/me").set("authorization", `Bearer ${token}`);

    await me().expect(200);

    blocked.status = "BLOCKED";
    expect((await me().expect(401)).body.error.code).toBe("AUTH_UNAUTHORIZED");

    auth.users.delete(blocked.id);
    await me().expect(401);
  });

  it("uses the role stored for the user, not the one in the token", async () => {
    const forged = (await import("jsonwebtoken")).default.sign(
      { role: "ADMIN", issuedAtMs: Date.now() },
      process.env.JWT_ACCESS_SECRET ?? "",
      { subject: MEMBER_ID, expiresIn: "15m" },
    );

    const response = await request(app.getHttpServer())
      .get("/api/v1/users")
      .set("authorization", `Bearer ${forged}`)
      .expect(403);

    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("rejects a token signed with another algorithm", async () => {
    const none = (await import("jsonwebtoken")).default.sign({ role: "ADMIN" }, "", {
      algorithm: "none",
      subject: MEMBER_ID,
    });

    await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("authorization", `Bearer ${none}`)
      .expect(401);
  });

  it("rate-limits repeated login attempts for one account", async () => {
    const email = "target@example.local";
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 11; attempt += 1) {
      statuses.push((await login(email, "wrong-password")).status);
    }

    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
    expect((await login(email, "wrong-password")).body.error.code).toBe("RATE_LIMITED");
  });

  it("caps attempts per account even when every request claims a new IP", async () => {
    const email = "spoofed@example.local";
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 51; attempt += 1) {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .set("x-forwarded-for", `203.0.113.${attempt}`)
        .send({ email, password: "wrong-password" });
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 50).every((status) => status === 401)).toBe(true);
    expect(statuses[50]).toBe(429);
  });
});
