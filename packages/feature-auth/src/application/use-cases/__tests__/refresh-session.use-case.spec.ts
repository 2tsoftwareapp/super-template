import { describe, expect, it, vi } from "vitest";

import { REFRESH_ROTATION_GRACE_MS } from "../../../domain/refresh-rotation.policy";
import { hashRefreshToken } from "../../auth.helpers";
import { AuthMapper } from "../../auth.mapper";
import { RefreshSessionUseCase } from "../refresh-session.use-case";

const CURRENT_TOKEN = "current-refresh-token";
const PREVIOUS_TOKEN = "previous-refresh-token";

async function createSessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    userId: "user-1",
    refreshTokenHash: await hashRefreshToken(CURRENT_TOKEN),
    previousRefreshTokenHash: null,
    previousRotatedAt: null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    revokedAt: null,
    lastUsedAt: new Date(),
    ipAddress: null,
    userAgent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createHarness(sessionRow: Awaited<ReturnType<typeof createSessionRow>>) {
  const rotatedResult = {
    accessToken: "new-access",
    refreshToken: "new-refresh",
    session: { ...sessionRow, id: "session-1" },
  };

  const authRepository = {
    findSessionForUser: vi.fn(async () => sessionRow),
    revokeSession: vi.fn(async () => undefined),
  };
  const usersRepository = {
    findById: vi.fn(async () => ({
      id: "user-1",
      status: "ACTIVE",
      email: "user@example.local",
      displayName: "User One",
      avatarUrl: null,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
  const accessControlService = {
    getAccessProfile: vi.fn(async () => ({
      roles: ["USER"],
      permissions: [],
    })),
  };
  const organizationsService = {
    resolveOrganizationIdForUser: vi.fn(async () => "org-1"),
  };
  const sessionTokenService = {
    verifyToken: vi.fn(async () => ({
      sid: "session-1",
      sub: "user-1",
      oid: "org-1",
    })),
    rotateSessionTokens: vi.fn(async () => rotatedResult),
    tryRotateSessionTokens: vi.fn(async () => rotatedResult),
  };
  const authMapper = new AuthMapper();

  const useCase = new RefreshSessionUseCase(
    authRepository as never,
    usersRepository as never,
    accessControlService as never,
    organizationsService as never,
    sessionTokenService as never,
    authMapper,
  );

  return {
    useCase,
    authRepository,
    sessionTokenService,
    rotatedResult,
  };
}

describe("RefreshSessionUseCase rotation grace", () => {
  it("rotates strictly when the current token is presented", async () => {
    const session = await createSessionRow();
    const { useCase, sessionTokenService, authRepository } = createHarness(session);

    const result = await useCase.execute({ refreshToken: CURRENT_TOKEN });

    expect(result.accessToken).toBe("new-access");
    expect(sessionTokenService.tryRotateSessionTokens).toHaveBeenCalledTimes(1);
    expect(authRepository.revokeSession).not.toHaveBeenCalled();
  });

  it("honors the previous token inside the grace window (grace rotation)", async () => {
    const session = await createSessionRow({
      previousRefreshTokenHash: await hashRefreshToken(PREVIOUS_TOKEN),
      previousRotatedAt: new Date(Date.now() - 5_000),
    });
    const { useCase, sessionTokenService, authRepository } = createHarness(session);

    const result = await useCase.execute({ refreshToken: PREVIOUS_TOKEN });

    expect(result.accessToken).toBe("new-access");
    expect(sessionTokenService.tryRotateSessionTokens).toHaveBeenCalledTimes(1);
    expect(authRepository.revokeSession).not.toHaveBeenCalled();
  });

  it("retries the grace CAS against a re-read session before giving up", async () => {
    const session = await createSessionRow({
      previousRefreshTokenHash: await hashRefreshToken(PREVIOUS_TOKEN),
      previousRotatedAt: new Date(Date.now() - 5_000),
    });
    const { useCase, sessionTokenService, rotatedResult } = createHarness(session);
    // First CAS misses (another racer rotated); the retry wins.
    sessionTokenService.tryRotateSessionTokens
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce(rotatedResult as never);

    const result = await useCase.execute({ refreshToken: PREVIOUS_TOKEN });

    expect(result.accessToken).toBe("new-access");
    expect(sessionTokenService.tryRotateSessionTokens).toHaveBeenCalledTimes(2);
  });

  it("revokes the session when the previous token is outside the grace window", async () => {
    const session = await createSessionRow({
      previousRefreshTokenHash: await hashRefreshToken(PREVIOUS_TOKEN),
      previousRotatedAt: new Date(Date.now() - REFRESH_ROTATION_GRACE_MS - 1_000),
    });
    const { useCase, authRepository, sessionTokenService } = createHarness(session);

    await expect(useCase.execute({ refreshToken: PREVIOUS_TOKEN })).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
    });
    expect(authRepository.revokeSession).toHaveBeenCalledWith("session-1");
    expect(sessionTokenService.tryRotateSessionTokens).not.toHaveBeenCalled();
  });

  it("revokes the session for a token matching neither current nor previous", async () => {
    const session = await createSessionRow({
      previousRefreshTokenHash: await hashRefreshToken(PREVIOUS_TOKEN),
      previousRotatedAt: new Date(Date.now() - 5_000),
    });
    const { useCase, authRepository } = createHarness(session);

    await expect(
      useCase.execute({ refreshToken: "stolen-or-ancient-token" }),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED });
    expect(authRepository.revokeSession).toHaveBeenCalledWith("session-1");
  });
});

import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
