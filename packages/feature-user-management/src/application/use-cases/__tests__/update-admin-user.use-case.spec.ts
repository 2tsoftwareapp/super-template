import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { USER_ERROR_CODES, type UpdateUserInput } from "@repo/feature-users/contracts";

import { UpdateAdminUserUseCase } from "../update-admin-user.use-case";

const ORG_A = "org-a";

const targetRecord = {
  id: "user-target",
  email: "target@example.com",
  passwordHash: "hash",
  displayName: "Target User",
  avatarUrl: "https://cdn.example.com/avatar.png",
  avatarFileId: "file-1",
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

const userProfile = { id: "user-target", displayName: "Target User" };

const requestContext = { requestId: "req-1", ipAddress: "203.0.113.10", userAgent: "vitest" };

function buildUseCase(
  options: {
    target?: typeof targetRecord | null;
    membership?: unknown;
    existingEmailOwner?: { id: string } | null;
    targetRoles?: string[];
  } = {},
) {
  const target = options.target === undefined ? targetRecord : options.target;
  const membership = options.membership === undefined ? { role: "MEMBER" } : options.membership;

  const usersRepository = {
    findById: vi.fn(async () => target),
    findByEmail: vi.fn(async () => options.existingEmailOwner ?? null),
    update: vi.fn(async (_userId: string, values: UpdateUserInput) => ({
      ...targetRecord,
      ...values,
    })),
  };
  const accessControlService = {
    getAccessProfile: vi.fn(async () => ({ roles: options.targetRoles ?? ["USER"] })),
    assertCanManageUserAccount: vi.fn(),
  };
  const organizationMembership = {
    findMembership: vi.fn(async () => membership),
  };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const getUserUseCase = { execute: vi.fn(async () => userProfile) };

  return {
    usersRepository,
    accessControlService,
    organizationMembership,
    auditWriter,
    getUserUseCase,
    useCase: new UpdateAdminUserUseCase(
      usersRepository as never,
      accessControlService as never,
      organizationMembership as never,
      auditWriter as never,
      getUserUseCase as never,
    ),
  };
}

describe("UpdateAdminUserUseCase", () => {
  describe("organization guard", () => {
    it("rejects an actor outside the target user's organization before reading the user", async () => {
      const deps = buildUseCase({ membership: null });

      await expect(
        deps.useCase.execute(actor(), "user-target", { displayName: "Renamed" }),
      ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
      expect(deps.usersRepository.findById).not.toHaveBeenCalled();
      expect(deps.usersRepository.update).not.toHaveBeenCalled();
    });

    it("rejects an actor without an organization context", async () => {
      const deps = buildUseCase();

      await expect(
        deps.useCase.execute(actor({ organizationId: null }), "user-target", {
          displayName: "Renamed",
        }),
      ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
      expect(deps.organizationMembership.findMembership).not.toHaveBeenCalled();
    });

    it("allows an actor who shares the target user's organization", async () => {
      const deps = buildUseCase();

      await expect(
        deps.useCase.execute(actor(), "user-target", { displayName: "Renamed" }),
      ).resolves.toBe(userProfile);
      expect(deps.organizationMembership.findMembership).toHaveBeenCalledWith(ORG_A, "user-target");
      expect(deps.accessControlService.getAccessProfile).toHaveBeenCalledWith("user-target", ORG_A);
    });

    it("lets SUPER_ADMIN update a user outside their own organization scope", async () => {
      const deps = buildUseCase({ membership: null });

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", { displayName: "Renamed" }),
      ).resolves.toBe(userProfile);
      expect(deps.organizationMembership.findMembership).not.toHaveBeenCalled();
      expect(deps.accessControlService.getAccessProfile).toHaveBeenCalledWith("user-target", null);
    });
  });

  describe("update behaviour", () => {
    it("normalizes the submitted email and audits the change", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(
        superAdmin(),
        "user-target",
        { email: "  New@Example.COM " },
        requestContext,
      );

      expect(deps.usersRepository.findByEmail).toHaveBeenCalledWith("new@example.com");
      expect(deps.usersRepository.update).toHaveBeenCalledWith("user-target", {
        email: "new@example.com",
        displayName: targetRecord.displayName,
        avatarUrl: targetRecord.avatarUrl,
      });
      expect(deps.auditWriter.log).toHaveBeenCalledWith({
        actorId: "admin-1",
        action: "admin.user.updated",
        entityType: "user",
        entityId: "user-target",
        requestContext,
        scope: SYSTEM_SCOPE.PLATFORM,
      });
      expect(deps.getUserUseCase.execute).toHaveBeenCalledWith("user-target", superAdmin());
    });

    it("keeps the stored values for fields that were not submitted", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), "user-target", { displayName: "Renamed" });

      expect(deps.usersRepository.update).toHaveBeenCalledWith("user-target", {
        email: targetRecord.email,
        displayName: "Renamed",
        avatarUrl: targetRecord.avatarUrl,
      });
      expect(deps.usersRepository.findByEmail).not.toHaveBeenCalled();
    });

    it("clears the avatar when it is submitted as null", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), "user-target", { avatarUrl: null });

      expect(deps.usersRepository.update).toHaveBeenCalledWith(
        "user-target",
        expect.objectContaining({ avatarUrl: null }),
      );
    });

    it("audits on the organization scope for an actor inside an organization", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(actor(), "user-target", { displayName: "Renamed" });

      expect(deps.auditWriter.log).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: SYSTEM_SCOPE.ORGANIZATION,
          organizationId: ORG_A,
        }),
      );
    });

    it("checks the target account against its access profile roles", async () => {
      const deps = buildUseCase({ targetRoles: [ROLE_NAMES.SUPER_ADMIN] });

      await deps.useCase.execute(superAdmin(), "user-target", { displayName: "Renamed" });

      expect(deps.accessControlService.assertCanManageUserAccount).toHaveBeenCalledWith(
        superAdmin(),
        [ROLE_NAMES.SUPER_ADMIN],
      );
    });
  });

  describe("failures", () => {
    it("reports a missing user as NOT_FOUND", async () => {
      const deps = buildUseCase({ target: null });

      await expect(
        deps.useCase.execute(superAdmin(), "user-missing", { displayName: "Renamed" }),
      ).rejects.toMatchObject({ code: USER_ERROR_CODES.USER_NOT_FOUND, statusCode: 404 });
      expect(deps.usersRepository.update).not.toHaveBeenCalled();
    });

    it("rejects an email that belongs to another user", async () => {
      const deps = buildUseCase({ existingEmailOwner: { id: "user-other" } });

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", { email: "taken@example.com" }),
      ).rejects.toMatchObject({
        code: USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
        statusCode: 409,
      });
      expect(deps.usersRepository.update).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).not.toHaveBeenCalled();
    });

    it("accepts the target user's own current email", async () => {
      const deps = buildUseCase({ existingEmailOwner: { id: "user-target" } });

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", { email: targetRecord.email }),
      ).resolves.toBe(userProfile);
      expect(deps.usersRepository.update).toHaveBeenCalled();
    });

    it("does not update or audit when the access check rejects the target", async () => {
      const deps = buildUseCase();
      deps.accessControlService.assertCanManageUserAccount.mockImplementationOnce(() => {
        throw new Error("forbidden target");
      });

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", { displayName: "Renamed" }),
      ).rejects.toThrow("forbidden target");
      expect(deps.usersRepository.update).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).not.toHaveBeenCalled();
      expect(deps.getUserUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
