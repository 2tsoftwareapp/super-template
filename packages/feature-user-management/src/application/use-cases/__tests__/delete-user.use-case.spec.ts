import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";

import { DeleteUserUseCase } from "../delete-user.use-case";

const ORG_A = "org-a";

const targetRecord = {
  id: "user-target",
  email: "target@example.com",
  passwordHash: "hash",
  displayName: "Target User",
  avatarUrl: null,
  avatarFileId: null,
  status: "ACTIVE" as const,
  emailVerifiedAt: null,
  mustChangePassword: false,
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const actor = (overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser => ({
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.com",
  displayName: "Admin",
  status: "ACTIVE",
  roles: [ROLE_NAMES.USER],
  permissions: [],
  organizationId: ORG_A,
  ...overrides,
});

const superAdmin = () => actor({ roles: [ROLE_NAMES.SUPER_ADMIN], organizationId: null });

const requestContext = { requestId: "req-1", ipAddress: "203.0.113.10", userAgent: "vitest" };

function buildUseCase(
  options: {
    target?: typeof targetRecord | null;
    membership?: unknown;
    targetRoles?: string[];
  } = {},
) {
  const target = options.target === undefined ? targetRecord : options.target;
  const membership = options.membership === undefined ? { role: "MEMBER" } : options.membership;

  const transaction = { id: "tx-1" };
  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(transaction)),
  };
  const usersRepository = {
    findById: vi.fn(async () => target),
    softDelete: vi.fn(async () => target),
  };
  const accessControlService = {
    getAccessProfile: vi.fn(async () => ({ roles: options.targetRoles ?? ["USER"] })),
    assertCanManageUserAccount: vi.fn(),
  };
  const organizationMembership = {
    findMembership: vi.fn(async () => membership),
  };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const outbox = { append: vi.fn(async () => undefined) };

  return {
    transaction,
    transactionPort,
    usersRepository,
    accessControlService,
    organizationMembership,
    auditWriter,
    outbox,
    useCase: new DeleteUserUseCase(
      transactionPort as never,
      usersRepository as never,
      accessControlService as never,
      organizationMembership as never,
      auditWriter as never,
      outbox as never,
    ),
  };
}

describe("DeleteUserUseCase", () => {
  it("soft-deletes inside a transaction, queues the lifecycle event, and audits the deletion", async () => {
    const deps = buildUseCase();

    await deps.useCase.execute(superAdmin(), "user-target", requestContext);

    expect(deps.usersRepository.softDelete).toHaveBeenCalledWith("user-target", deps.transaction);
    expect(deps.outbox.append).toHaveBeenCalledWith(
      "user.lifecycle.deleted",
      { userId: "user-target" },
      deps.transaction,
    );
    expect(deps.auditWriter.log).toHaveBeenCalledWith(
      {
        actorId: "admin-1",
        action: "admin.user.deleted",
        entityType: "user",
        entityId: "user-target",
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      },
      deps.transaction,
    );
  });

  it("audits on the organization scope for an actor inside an organization", async () => {
    const deps = buildUseCase();

    await deps.useCase.execute(actor(), "user-target");

    expect(deps.accessControlService.getAccessProfile).toHaveBeenCalledWith("user-target", ORG_A);
    expect(deps.auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: SYSTEM_SCOPE.ORGANIZATION,
        organizationId: ORG_A,
      }),
      deps.transaction,
    );
  });

  it("checks the target account against its access profile roles", async () => {
    const deps = buildUseCase({ targetRoles: ["SUPER_ADMIN"] });

    await deps.useCase.execute(superAdmin(), "user-target");

    expect(deps.accessControlService.assertCanManageUserAccount).toHaveBeenCalledWith(
      superAdmin(),
      ["SUPER_ADMIN"],
    );
  });

  describe("organization guard", () => {
    it("rejects an actor outside the target user's organization before reading the user", async () => {
      const deps = buildUseCase({ membership: null });

      await expect(deps.useCase.execute(actor(), "user-target")).rejects.toMatchObject({
        code: ERROR_CODES.AUTH_FORBIDDEN,
        statusCode: 403,
      });
      expect(deps.usersRepository.findById).not.toHaveBeenCalled();
      expect(deps.usersRepository.softDelete).not.toHaveBeenCalled();
    });

    it("rejects an actor without an organization context", async () => {
      const deps = buildUseCase();

      await expect(
        deps.useCase.execute(actor({ organizationId: null }), "user-target"),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN, statusCode: 403 });
      expect(deps.organizationMembership.findMembership).not.toHaveBeenCalled();
    });
  });

  describe("failures", () => {
    it("refuses to delete the actor's own account", async () => {
      const deps = buildUseCase();

      await expect(deps.useCase.execute(superAdmin(), "admin-1")).rejects.toMatchObject({
        code: ERROR_CODES.AUTH_FORBIDDEN,
        statusCode: 403,
      });
      expect(deps.usersRepository.softDelete).not.toHaveBeenCalled();
      expect(deps.outbox.append).not.toHaveBeenCalled();
    });

    it("reports a missing user as NOT_FOUND", async () => {
      const deps = buildUseCase({ target: null });

      await expect(deps.useCase.execute(superAdmin(), "user-missing")).rejects.toMatchObject({
        code: USER_ERROR_CODES.USER_NOT_FOUND,
        statusCode: 404,
      });
      expect(deps.transactionPort.run).not.toHaveBeenCalled();
    });

    it("writes nothing when the access check rejects the target", async () => {
      const deps = buildUseCase();
      deps.accessControlService.assertCanManageUserAccount.mockImplementationOnce(() => {
        throw new Error("forbidden target");
      });

      await expect(deps.useCase.execute(superAdmin(), "user-target")).rejects.toThrow(
        "forbidden target",
      );
      expect(deps.transactionPort.run).not.toHaveBeenCalled();
      expect(deps.usersRepository.softDelete).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).not.toHaveBeenCalled();
    });
  });
});
