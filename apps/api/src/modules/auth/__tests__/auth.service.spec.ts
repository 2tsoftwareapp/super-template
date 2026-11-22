import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DatabaseService } from "../../../shared/database.service";
import type { NotificationsService } from "../../notifications/notifications.service";
import type { AuthRepository } from "../auth.repository";

import { AuthService } from "../auth.service";
import { TokenService } from "../token.service";

process.env.DATABASE_URL = "postgresql://unused";
process.env.JWT_ACCESS_SECRET = "0123456789012345678901234567890123";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const TOKEN = "refresh-token-under-test";
const now = Date.now();

const activeUser = {
  id: USER_ID,
  email: "a@example.local",
  passwordHash: "x",
  displayName: "A",
  role: "USER",
  status: "ACTIVE",
  createdAt: new Date(now),
  updatedAt: new Date(now),
};

function session(overrides: { revokedAt?: Date | null; expiresAt?: Date } = {}) {
  return {
    id: "session-1",
    userId: USER_ID,
    refreshTokenHash: createHash("sha256").update(TOKEN).digest("hex"),
    expiresAt: new Date(now + 60_000),
    revokedAt: null,
    createdAt: new Date(now),
    ...overrides,
  };
}

describe("AuthService.refresh", () => {
  const repository = {
    findSessionByHash: vi.fn(),
    findById: vi.fn(),
    rotateSession: vi.fn(),
    revokeAllForUser: vi.fn(),
  };
  const service = new AuthService(
    repository as unknown as AuthRepository,
    new TokenService(),
    {} as NotificationsService,
    {} as DatabaseService,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    repository.findById.mockResolvedValue(activeUser);
    repository.rotateSession.mockResolvedValue("rotated");
  });

  it("rotates an active session into a new token pair", async () => {
    repository.findSessionByHash.mockResolvedValue(session());

    const issued = await service.refresh(TOKEN);

    expect(issued.refreshToken).not.toBe(TOKEN);
    expect(repository.rotateSession).toHaveBeenCalledWith(
      "session-1",
      expect.objectContaining({ userId: USER_ID }),
    );
  });

  it("rejects the loser of a concurrent rotation without revoking anything", async () => {
    repository.findSessionByHash.mockResolvedValue(session());
    repository.rotateSession.mockResolvedValue("lost-race");

    await expect(service.refresh(TOKEN)).rejects.toMatchObject({ code: "AUTH_SESSION_ROTATED" });
    expect(repository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it("treats a token revoked moments ago as a lost race", async () => {
    repository.findSessionByHash.mockResolvedValue(
      session({ revokedAt: new Date(Date.now() - 2_000) }),
    );

    await expect(service.refresh(TOKEN)).rejects.toMatchObject({ code: "AUTH_SESSION_ROTATED" });
    expect(repository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it("treats a token revoked long ago as replay and revokes every session", async () => {
    repository.findSessionByHash.mockResolvedValue(
      session({ revokedAt: new Date(Date.now() - 60_000) }),
    );

    await expect(service.refresh(TOKEN)).rejects.toMatchObject({ code: "AUTH_TOKEN_REUSED" });
    expect(repository.revokeAllForUser).toHaveBeenCalledWith(USER_ID);
  });

  it("refuses an expired session", async () => {
    repository.findSessionByHash.mockResolvedValue(
      session({ expiresAt: new Date(Date.now() - 1) }),
    );

    await expect(service.refresh(TOKEN)).rejects.toMatchObject({
      code: "AUTH_UNAUTHORIZED",
      status: 401,
    });
    expect(repository.rotateSession).not.toHaveBeenCalled();
  });

  it("revokes every session of a blocked user", async () => {
    repository.findSessionByHash.mockResolvedValue(session());
    repository.findById.mockResolvedValue({ ...activeUser, status: "BLOCKED" });

    await expect(service.refresh(TOKEN)).rejects.toMatchObject({ status: 403 });
    expect(repository.revokeAllForUser).toHaveBeenCalledWith(USER_ID);
  });

  it("refuses to issue a successor when the user was blocked mid-rotation", async () => {
    repository.findSessionByHash.mockResolvedValue(session());
    repository.rotateSession.mockResolvedValue("inactive");

    await expect(service.refresh(TOKEN)).rejects.toMatchObject({ status: 403 });
  });
});
