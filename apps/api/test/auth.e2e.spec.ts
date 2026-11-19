import type { INestApplication } from "@nestjs/common";

import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { hashPassword, type UserRow } from "@lean/db";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AppModule } from "../src/app.module";
import { AuthRepository } from "../src/modules/auth/auth.repository";
import { AppExceptionFilter } from "../src/shared/app-exception.filter";

process.env.DATABASE_URL = "postgresql://unused";
process.env.JWT_ACCESS_SECRET = "0123456789012345678901234567890123";
process.env.JWT_ACCESS_TTL = "15m";
process.env.JWT_REFRESH_TTL = "30d";

const PASSWORD = "ChangeMe123!";

function seedUser(): UserRow {
  const now = new Date();

  return {
    id: "11111111-1111-4111-8111-111111111111",
    email: "admin@example.local",
    passwordHash: hashPassword(PASSWORD),
    displayName: "Admin",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };
}

/** Same contract as AuthRepository, in memory: the e2e tests the HTTP surface. */
class InMemoryAuthRepository {
  private readonly users = new Map<string, UserRow>();
  private readonly sessions = new Map<
    string,
    { id: string; userId: string; tokenHash: string; expiresAt: Date; revokedAt: Date | null }
  >();

  constructor(user: UserRow) {
    this.users.set(user.id, user);
  }

  async findByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async createSession(input: { userId: string; refreshTokenHash: string; expiresAt: Date }) {
    this.sessions.set(input.refreshTokenHash, {
      id: `session-${this.sessions.size + 1}`,
      userId: input.userId,
      tokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    });
  }

  async findSessionByHash(refreshTokenHash: string) {
    const session = this.sessions.get(refreshTokenHash);
    return session
      ? {
          id: session.id,
          userId: session.userId,
          revokedAt: session.revokedAt,
          expiresAt: session.expiresAt,
          refreshTokenHash,
        }
      : null;
  }

  async revokeSession(id: string) {
    for (const session of this.sessions.values()) {
      if (session.id === id) session.revokedAt = new Date();
    }
  }

  async revokeSessionByHash(hash: string) {
    const session = this.sessions.get(hash);
    if (session) session.revokedAt = new Date();
  }

  async revokeAllForUser(userId: string) {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) session.revokedAt = new Date();
    }
  }
}

describe("auth (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuthRepository)
      .useValue(new InMemoryAuthRepository(seedUser()))
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const login = () =>
    request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@example.local", password: PASSWORD });

  it("logs in, reads the profile and rotates the refresh token", async () => {
    const loginResponse = await login().expect(200);
    const { accessToken, refreshToken } = loginResponse.body.data;

    const me = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(me.body.data.email).toBe("admin@example.local");

    const refreshed = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(200);

    expect(refreshed.body.data.refreshToken).not.toBe(refreshToken);
  });

  it("rejects a wrong password without revealing which field failed", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "admin@example.local", password: "wrong-password" })
      .expect(401);

    expect(response.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(response.body.error.message).toBe("Invalid email or password");
  });

  it("detects replay of a rotated token and revokes the whole session", async () => {
    const { refreshToken } = (await login().expect(200)).body.data;
    const rotated = (
      await request(app.getHttpServer())
        .post("/api/v1/auth/refresh")
        .send({ refreshToken })
        .expect(200)
    ).body.data.refreshToken;

    const replay = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);

    expect(replay.body.error.code).toBe("AUTH_TOKEN_REUSED");

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: rotated })
      .expect(401);
  });

  it("logout revokes the refresh token and blocks later refreshes", async () => {
    const { refreshToken } = (await login().expect(200)).body.data;

    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .send({ refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });
});
