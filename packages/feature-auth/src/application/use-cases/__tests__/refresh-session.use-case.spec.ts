import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
import { describe, expect, it, vi } from "vitest";

import { REFRESH_ROTATION_GRACE_MS } from "../../../domain/refresh-rotation.policy";
import { hashRefreshToken } from "../../auth.helpers";
import { AuthMapper } from "../../auth.mapper";
import { RefreshSessionUseCase } from "../refresh-session.use-case";

const CURRENT_TOKEN = "current-refresh-token";
const PREVIOUS_TOKEN = "previous-refresh-token";

/**
 * Port-level suite: the rotation decision itself, with the token provider
 * stubbed. The concurrency behaviour of the same decision (real JWT signing,
 * real CAS, real re-reads) lives in `refresh-session-rotation.spec.ts`.
 */
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

async function createHarness(sessionRow: Awaited<ReturnType<typeof createSessionRow>>) {
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
      mustChangePassword: false,
    })),
    findByIdStrong: vi.fn(async () => ({
      id: "user-1",
      status: "ACTIVE",
      email: "user@example.local",
      displayName: "User One",
      avatarUrl: null,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      mustChangePassword: false,
    })),
  };
  const authAccessProfile = {
    getAccessProfile: vi.fn(async () => ({
      roles: ["USER"],
      permissions: [],
    })),
  };
  const authOrganizationContext = {
    resolveOrganizationIdForUser: vi.fn(async () => "org-1"),
  };
  const sessionTokenService = {
    verifyToken: vi.fn(async () => ({
      sid: "session-1",
      sub: "user-1",
      oid: "org-1",
    })),
    tryRotateSessionTokens: vi.fn(async () => rotatedResult),
    replayRotationTokens: vi.fn(async () => ({
      accessToken: "replayed-access",
      refreshToken: "replayed-refresh",
      // The replay must re-derive the pair the session is currently on.
      refreshTokenHash: sessionRow.refreshTokenHash,
    })),
  };
  const authMapper = new AuthMapper();

  const useCase = new RefreshSessionUseCase(
    authRepository as never,
    usersRepository as never,
    authAccessProfile as never,
    authOrganizationContext as never,
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

describe("RefreshSessionUseCase — rotation decision", () => {
  it("rotates strictly when the current token is presented", async () => {
    const session = await createSessionRow();
    const { useCase, sessionTokenService, authRepository } = await createHarness(session);

    const result = await useCase.execute({ refreshToken: CURRENT_TOKEN });

    expect(result.accessToken).toBe("new-access");
    expect(sessionTokenService.tryRotateSessionTokens).toHaveBeenCalledTimes(1);
    expect(sessionTokenService.replayRotationTokens).not.toHaveBeenCalled();
    expect(authRepository.revokeSession).not.toHaveBeenCalled();
  });

  it("replays the rotation's own pair for the consumed token inside the window", async () => {
    // A retry of the rotation that consumed PREVIOUS_TOKEN: it must return what
    // that rotation issued and must not rotate again (a second rotation would
    // immediately supersede the pair every other retry received).
    const session = await createSessionRow({
      previousRefreshTokenHash: await hashRefreshToken(PREVIOUS_TOKEN),
      previousRotatedAt: new Date(Date.now() - 5_000),
    });
    const { useCase, sessionTokenService, authRepository } = await createHarness(session);

    const result = await useCase.execute({ refreshToken: PREVIOUS_TOKEN });

    expect(result.accessToken).toBe("replayed-access");
    expect(result.refreshToken).toBe("replayed-refresh");
    expect(sessionTokenService.replayRotationTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-1",
        userId: "user-1",
        organizationId: "org-1",
        consumedTokenHash: session.previousRefreshTokenHash,
        rotatedAt: session.previousRotatedAt,
      }),
    );
    expect(sessionTokenService.tryRotateSessionTokens).not.toHaveBeenCalled();
    expect(authRepository.revokeSession).not.toHaveBeenCalled();
  });

  it("re-classifies after a CAS miss instead of revoking", async () => {
    // The caller presented the current token but another request rotated first.
    // The winner consumed exactly this token, so it is now the previous one: the
    // loser must replay that rotation, not lose the session.
    const session = await createSessionRow();
    const rotatedSession = await createSessionRow({
      refreshTokenHash: await hashRefreshToken("token-the-winner-received"),
      previousRefreshTokenHash: await hashRefreshToken(CURRENT_TOKEN),
      previousRotatedAt: new Date(),
    });
    const { useCase, authRepository, sessionTokenService } = await createHarness(session);
    sessionTokenService.tryRotateSessionTokens.mockResolvedValueOnce(null as never);
    sessionTokenService.replayRotationTokens.mockResolvedValueOnce({
      accessToken: "replayed-access",
      refreshToken: "replayed-refresh",
      refreshTokenHash: rotatedSession.refreshTokenHash,
    } as never);
    authRepository.findSessionForUser
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce(rotatedSession as never);

    const result = await useCase.execute({ refreshToken: CURRENT_TOKEN });

    expect(result.accessToken).toBe("replayed-access");
    expect(authRepository.revokeSession).not.toHaveBeenCalled();
  });

  it("fails closed when the replayed pair is not the session's live pair", async () => {
    // The presented token belongs to a rotation that is not the one the session
    // is on (e.g. the organization changed in between) — treat it as reuse.
    const session = await createSessionRow({
      previousRefreshTokenHash: await hashRefreshToken(PREVIOUS_TOKEN),
      previousRotatedAt: new Date(Date.now() - 5_000),
    });
    const { useCase, authRepository, sessionTokenService } = await createHarness(session);
    sessionTokenService.replayRotationTokens.mockResolvedValueOnce({
      accessToken: "replayed-access",
      refreshToken: "replayed-refresh",
      refreshTokenHash: "hash-of-some-other-rotation",
    } as never);

    await expect(useCase.execute({ refreshToken: PREVIOUS_TOKEN })).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
    });
    expect(authRepository.revokeSession).toHaveBeenCalledWith("session-1");
  });

  it("reports a conflict without revoking when contention never settles", async () => {
    // Every CAS misses while the session keeps showing the token as current.
    // Contention alone is not evidence of theft, so the session must survive.
    const session = await createSessionRow();
    const { useCase, authRepository, sessionTokenService } = await createHarness(session);
    sessionTokenService.tryRotateSessionTokens.mockResolvedValue(null as never);

    await expect(useCase.execute({ refreshToken: CURRENT_TOKEN })).rejects.toMatchObject({
      code: "RESOURCE_CONFLICT",
    });
    expect(authRepository.revokeSession).not.toHaveBeenCalled();
  });

  it("revokes the session when the previous token is outside the grace window", async () => {
    const session = await createSessionRow({
      previousRefreshTokenHash: await hashRefreshToken(PREVIOUS_TOKEN),
      previousRotatedAt: new Date(Date.now() - REFRESH_ROTATION_GRACE_MS - 1_000),
    });
    const { useCase, authRepository, sessionTokenService } = await createHarness(session);

    await expect(useCase.execute({ refreshToken: PREVIOUS_TOKEN })).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
    });
    expect(authRepository.revokeSession).toHaveBeenCalledWith("session-1");
    expect(sessionTokenService.tryRotateSessionTokens).not.toHaveBeenCalled();
    expect(sessionTokenService.replayRotationTokens).not.toHaveBeenCalled();
  });

  it("revokes the session for a token matching neither current nor previous", async () => {
    const session = await createSessionRow({
      previousRefreshTokenHash: await hashRefreshToken(PREVIOUS_TOKEN),
      previousRotatedAt: new Date(Date.now() - 5_000),
    });
    const { useCase, authRepository } = await createHarness(session);

    await expect(
      useCase.execute({ refreshToken: "stolen-or-ancient-token" }),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED });
    expect(authRepository.revokeSession).toHaveBeenCalledWith("session-1");
  });
});
