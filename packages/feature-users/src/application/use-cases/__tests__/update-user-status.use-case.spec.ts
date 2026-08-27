import { USER_ERROR_CODES } from "@repo/feature-users/contracts";
import { ERROR_CODES } from "@repo/api-runtime";
import { describe, expect, it, vi } from "vitest";

import { UpdateUserStatusUseCase } from "../update-user-status.use-case";

const actor = {
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.local",
  displayName: "Admin",
  status: "ACTIVE" as const,
  roles: ["SUPER_ADMIN"],
  organizationId: null,
};

function buildDependencies(
  overrides: {
    target?: { id: string; emailVerifiedAt: Date | null };
  } = {},
) {
  const target = overrides.target ?? {
    id: "user-1",
    emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  const usersRepository = {
    isUserInOrganization: vi.fn(async () => true),
    findById: vi.fn(async (): Promise<typeof target | null> => target),
    update: vi.fn(async () => target),
  };

  const accessControlService = {
    getAccessProfile: vi.fn(async () => ({ roles: ["USER"] })),
    assertCanManageUserAccount: vi.fn(() => undefined),
  };

  const auditWriter = { log: vi.fn(async () => undefined) };
  const authTokenCleanup = {
    cleanupExpiredTokens: vi.fn(async () => undefined),
    revokeAllSessionsForUser: vi.fn(async () => undefined),
  };
  const outbox = { append: vi.fn(async () => undefined) };
  const activityEmitter = { emit: vi.fn(async () => undefined) };
  const getUserUseCase = {
    execute: vi.fn(async () => ({ id: target.id, status: "ACTIVE" })),
  };

  const transactionPort = {
    run: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => fn(null)),
    withTenant: vi
      .fn()
      .mockImplementation(async (_tenant: unknown, fn: unknown) =>
        (fn as (tx: unknown) => unknown)(null),
      ),
  };

  const useCase = new UpdateUserStatusUseCase(
    transactionPort as never,
    usersRepository as never,
    accessControlService as never,
    auditWriter as never,
    outbox as never,
    activityEmitter as never,
    getUserUseCase as never,
  );

  return {
    useCase,
    usersRepository,
    accessControlService,
    auditWriter,
    authTokenCleanup,
    outbox,
    activityEmitter,
  };
}

describe("UpdateUserStatusUseCase", () => {
  it("blocks a user from changing their own status", async () => {
    const { useCase } = buildDependencies();

    await expect(
      useCase.execute({ ...actor, userId: "user-1" } as never, "user-1", "BLOCKED"),
    ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });
  });

  it("throws when the target user does not exist", async () => {
    const deps = buildDependencies();
    deps.usersRepository.findById.mockResolvedValueOnce(null);

    await expect(deps.useCase.execute(actor as never, "missing", "BLOCKED")).rejects.toMatchObject({
      code: USER_ERROR_CODES.USER_NOT_FOUND,
    });
    expect(deps.usersRepository.update).not.toHaveBeenCalled();
  });

  it("revokes all sessions and writes an audit log when blocking", async () => {
    const { useCase, auditWriter, authTokenCleanup, activityEmitter, outbox } = buildDependencies();

    await useCase.execute(actor as never, "user-1", "BLOCKED");

    expect(outbox.append).toHaveBeenCalledWith(
      "user.lifecycle.status-blocked",
      { userId: "user-1" },
      null,
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.blocked", entityId: "user-1" }),
      null,
    );
  });

  it("emits an activity when blocking a user in an organization context", async () => {
    const { useCase, activityEmitter } = buildDependencies();

    await useCase.execute({ ...actor, organizationId: "org-1" } as never, "user-1", "BLOCKED");

    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        entityType: "user",
        entityId: "user-1",
        actorId: "admin-1",
        metadata: { status: "BLOCKED" },
      }),
      null,
    );
  });

  it("skips activity emission when the actor has no organization context", async () => {
    const { useCase, activityEmitter } = buildDependencies();

    await useCase.execute(actor as never, "user-1", "BLOCKED");

    expect(activityEmitter.emit).not.toHaveBeenCalled();
  });
});
