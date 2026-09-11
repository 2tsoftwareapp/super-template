import { describe, expect, it, vi } from "vitest";

import { AuthenticateAccessTokenUseCase } from "../authenticate-access-token.use-case";

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    userId: "user-1",
    refreshTokenHash: "hash",
    previousRefreshTokenHash: null,
    previousRotatedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    lastUsedAt: new Date(),
    ipAddress: null,
    userAgent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createHarness(sessionRow: ReturnType<typeof session>) {
  const authSessionRepository = {
    findSessionForUser: vi.fn().mockResolvedValue(sessionRow),
  };
  const usersRepository = {
    findByIdStrong: vi.fn().mockResolvedValue({
      id: "user-1",
      email: "user@example.local",
      displayName: "User",
      status: "ACTIVE",
      mustChangePassword: false,
    }),
  };
  const accessControlService = {
    getAccessProfileStrong: vi.fn().mockResolvedValue({ roles: ["USER"], permissions: [] }),
  };
  const organizationsService = {
    resolveOrganizationIdForUser: vi.fn().mockResolvedValue("org-1"),
  };
  const tokenProvider = {
    verifyToken: vi.fn().mockResolvedValue({ sid: "session-1", sub: "user-1", oid: "org-1" }),
  };

  return {
    useCase: new AuthenticateAccessTokenUseCase(
      authSessionRepository as never,
      usersRepository as never,
      accessControlService as never,
      organizationsService as never,
      tokenProvider as never,
    ),
    authSessionRepository,
    usersRepository,
    accessControlService,
  };
}

describe("AuthenticateAccessTokenUseCase strong reads", () => {
  // This suite proves the use case asks for strong reads on the ports it owns.
  // That the strong ports actually bypass the replica is proven by
  // UsersRepository.findByIdStrong in @repo/feature-users and end to end by
  // apps/api/test/tenant-isolation.e2e.spec.ts.
  it("rejects a revoked session using the repository's strong session read", async () => {
    const { useCase, authSessionRepository, usersRepository, accessControlService } = createHarness(
      session({ revokedAt: new Date() }),
    );

    await expect(useCase.execute("access-token")).rejects.toThrow("Session has been revoked");
    expect(authSessionRepository.findSessionForUser).toHaveBeenCalledWith("session-1", "user-1");
    expect(usersRepository.findByIdStrong).toHaveBeenCalledWith("user-1");
    expect(accessControlService.getAccessProfileStrong).not.toHaveBeenCalled();
  });

  it("uses strong user and permission reads for a valid access token", async () => {
    const { useCase, usersRepository, accessControlService } = createHarness(session());

    await expect(useCase.execute("rotated-access-token")).resolves.toMatchObject({
      userId: "user-1",
      organizationId: "org-1",
    });
    expect(usersRepository.findByIdStrong).toHaveBeenCalledWith("user-1");
    expect(accessControlService.getAccessProfileStrong).toHaveBeenCalledWith("user-1", "org-1");
  });
});
