import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";

import { ReplaceUserRolesUseCase } from "../replace-user-roles.use-case";

const ORG_A = "org-a";
const ORG_B = "org-b";

const USER_ROLE = {
  id: "role-user",
  name: ROLE_NAMES.USER,
  organizationId: null,
  isSystem: true,
};

const ORG_ADMIN_ROLE = {
  id: "role-admin-a",
  name: ROLE_NAMES.ADMIN,
  organizationId: ORG_A,
  isSystem: true,
};

const ORG_CUSTOM_ROLE = {
  id: "role-accountant-a",
  name: "ACCOUNTANT",
  organizationId: ORG_A,
  isSystem: false,
};

const OTHER_ORG_ROLE = {
  id: "role-accountant-b",
  name: "ACCOUNTANT",
  organizationId: ORG_B,
  isSystem: false,
};

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

const organizationAdmin = () => actor({ roles: [ROLE_NAMES.ADMIN], permissions: ["roles.update"] });

const userProfile = { id: "user-target" };

function buildUseCase(
  options: {
    target?: typeof targetRecord | null;
    actorMembership?: unknown;
    role?: unknown;
    targetRoles?: string[];
    roleMembership?: unknown;
  } = {},
) {
  const target = options.target === undefined ? targetRecord : options.target;
  const role = options.role === undefined ? USER_ROLE : options.role;
  // The port is read twice for an organization actor: once by the
  // `assertUserBelongsToOrganization` guard (before the transaction, so without
  // an executor) and once for the role scope (inside the transaction). Keying
  // off the executor keeps the two configurable apart.
  const actorMembership =
    options.actorMembership === undefined ? { role: "ADMIN" } : options.actorMembership;
  const roleMembership = options.roleMembership ?? null;

  const transaction = { id: "tx-1" };
  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(transaction)),
  };
  const usersRepository = {
    findById: vi.fn(async () => target),
  };
  const accessControlService = {
    getAccessProfile: vi.fn(async () => ({ roles: options.targetRoles ?? ["USER"] })),
    getRoleById: vi.fn(async () => role),
    assertCanAssignUserRoles: vi.fn(),
    ensureOrganizationAdminRole: vi.fn(async () => undefined),
    replaceUserRoles: vi.fn(async () => undefined),
  };
  const profileInvalidator = { invalidateAccessProfile: vi.fn(async () => undefined) };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const organizationMembership = {
    findMembership: vi.fn(async (_organizationId: string, _userId: string, executor?: unknown) =>
      executor === undefined ? actorMembership : roleMembership,
    ),
    addMember: vi.fn(async () => null),
    updateMemberRole: vi.fn(async () => null),
  };
  const getUserUseCase = { execute: vi.fn(async () => userProfile) };

  return {
    transaction,
    transactionPort,
    usersRepository,
    accessControlService,
    profileInvalidator,
    auditWriter,
    organizationMembership,
    getUserUseCase,
    useCase: new ReplaceUserRolesUseCase(
      transactionPort as never,
      usersRepository as never,
      accessControlService as never,
      profileInvalidator as never,
      auditWriter as never,
      organizationMembership as never,
      getUserUseCase as never,
    ),
  };
}

describe("ReplaceUserRolesUseCase", () => {
  describe("platform role", () => {
    it("replaces the roles with the platform scope and audits on the platform scope", async () => {
      const deps = buildUseCase();

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", USER_ROLE.id, null),
      ).resolves.toBe(userProfile);

      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-target",
        [USER_ROLE.id],
        null,
        deps.transaction,
      );
      expect(deps.organizationMembership.addMember).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "user.roles.replaced",
          entityId: "user-target",
          metadata: {
            roleId: USER_ROLE.id,
            roleName: ROLE_NAMES.USER,
            organizationId: null,
          },
          scope: SYSTEM_SCOPE.PLATFORM,
        }),
        deps.transaction,
      );
      expect(deps.getUserUseCase.execute).toHaveBeenCalledWith("user-target", superAdmin());
    });

    it("invalidates the access profile after the transaction commits", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), "user-target", USER_ROLE.id, null);

      expect(deps.profileInvalidator.invalidateAccessProfile).toHaveBeenCalledWith("user-target");
      expect(
        deps.profileInvalidator.invalidateAccessProfile.mock.invocationCallOrder[0]!,
      ).toBeGreaterThan(deps.transactionPort.run.mock.invocationCallOrder[0]!);
    });

    it("reads the target access profile without an organization for SUPER_ADMIN", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), "user-target", USER_ROLE.id, null);

      expect(deps.accessControlService.getAccessProfile).toHaveBeenCalledWith("user-target", null);
      expect(deps.accessControlService.assertCanAssignUserRoles).toHaveBeenCalledWith(
        superAdmin(),
        ["USER"],
        [ROLE_NAMES.USER],
      );
    });

    it("delegates the role decision with the target's current roles", async () => {
      const deps = buildUseCase({ targetRoles: ["ACCOUNTANT", "USER"] });

      await deps.useCase.execute(superAdmin(), "user-target", USER_ROLE.id, null);

      expect(deps.accessControlService.assertCanAssignUserRoles).toHaveBeenCalledWith(
        superAdmin(),
        ["ACCOUNTANT", "USER"],
        [ROLE_NAMES.USER],
      );
    });
  });

  describe("organization scoped role", () => {
    it("adds a membership and assigns the role for SUPER_ADMIN", async () => {
      const deps = buildUseCase({ role: ORG_CUSTOM_ROLE });

      await deps.useCase.execute(superAdmin(), "user-target", ORG_CUSTOM_ROLE.id, ORG_A);

      expect(deps.organizationMembership.findMembership).toHaveBeenCalledWith(
        ORG_A,
        "user-target",
        deps.transaction,
      );
      expect(deps.organizationMembership.addMember).toHaveBeenCalledWith(
        { organizationId: ORG_A, userId: "user-target", role: "MEMBER" },
        deps.transaction,
      );
      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-target",
        [ORG_CUSTOM_ROLE.id],
        ORG_A,
        deps.transaction,
      );
      expect(deps.auditWriter.log).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: SYSTEM_SCOPE.ORGANIZATION,
          organizationId: ORG_A,
        }),
        deps.transaction,
      );
    });

    it("grants the organization admin role through ensureOrganizationAdminRole", async () => {
      const deps = buildUseCase({ role: ORG_ADMIN_ROLE });

      await deps.useCase.execute(superAdmin(), "user-target", ORG_ADMIN_ROLE.id, ORG_A);

      expect(deps.organizationMembership.addMember).toHaveBeenCalledWith(
        { organizationId: ORG_A, userId: "user-target", role: "ADMIN" },
        deps.transaction,
      );
      expect(deps.accessControlService.ensureOrganizationAdminRole).toHaveBeenCalledWith(
        ORG_A,
        "user-target",
        deps.transaction,
      );
      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-target",
        [ORG_ADMIN_ROLE.id],
        ORG_A,
        deps.transaction,
      );
    });

    it("keeps a membership that already matches the target role", async () => {
      const deps = buildUseCase({
        role: ORG_CUSTOM_ROLE,
        roleMembership: { organizationId: ORG_A, userId: "user-target", role: "MEMBER" },
      });

      await deps.useCase.execute(superAdmin(), "user-target", ORG_CUSTOM_ROLE.id, ORG_A);

      expect(deps.organizationMembership.addMember).not.toHaveBeenCalled();
      expect(deps.organizationMembership.updateMemberRole).not.toHaveBeenCalled();
    });

    it("demotes an ADMIN membership when assigning a non-admin role", async () => {
      const deps = buildUseCase({
        role: ORG_CUSTOM_ROLE,
        roleMembership: { organizationId: ORG_A, userId: "user-target", role: "ADMIN" },
      });

      await deps.useCase.execute(superAdmin(), "user-target", ORG_CUSTOM_ROLE.id, ORG_A);

      expect(deps.organizationMembership.updateMemberRole).toHaveBeenCalledWith(
        ORG_A,
        "user-target",
        "MEMBER",
        deps.transaction,
      );
      expect(deps.organizationMembership.addMember).not.toHaveBeenCalled();
    });

    it("refuses to modify the roles of an organization OWNER", async () => {
      const deps = buildUseCase({
        role: ORG_CUSTOM_ROLE,
        roleMembership: { organizationId: ORG_A, userId: "user-target", role: "OWNER" },
      });

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", ORG_CUSTOM_ROLE.id, ORG_A),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN, statusCode: 403 });
      expect(deps.accessControlService.replaceUserRoles).not.toHaveBeenCalled();
      expect(deps.organizationMembership.updateMemberRole).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).not.toHaveBeenCalled();
    });

    it("lets an organization admin assign a custom role of their own organization", async () => {
      const deps = buildUseCase({ role: ORG_CUSTOM_ROLE });

      await deps.useCase.execute(organizationAdmin(), "user-target", ORG_CUSTOM_ROLE.id, ORG_A);

      expect(deps.accessControlService.getAccessProfile).toHaveBeenCalledWith("user-target", ORG_A);
      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-target",
        [ORG_CUSTOM_ROLE.id],
        ORG_A,
        deps.transaction,
      );
    });

    it("ignores a submitted organization that differs from the actor organization", async () => {
      const deps = buildUseCase({ role: ORG_CUSTOM_ROLE });

      await deps.useCase.execute(organizationAdmin(), "user-target", ORG_CUSTOM_ROLE.id, ORG_B);

      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-target",
        [ORG_CUSTOM_ROLE.id],
        ORG_A,
        deps.transaction,
      );
      expect(deps.auditWriter.log).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: ORG_A }),
        deps.transaction,
      );
    });
  });

  describe("guards", () => {
    it("rejects a role that belongs to a different organization", async () => {
      const deps = buildUseCase({ role: OTHER_ORG_ROLE });

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", OTHER_ORG_ROLE.id, ORG_A),
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED, statusCode: 400 });
      expect(deps.transactionPort.run).not.toHaveBeenCalled();
    });

    it("rejects a role from another organization for an organization actor", async () => {
      const deps = buildUseCase({ role: OTHER_ORG_ROLE });

      await expect(
        deps.useCase.execute(organizationAdmin(), "user-target", OTHER_ORG_ROLE.id, ORG_B),
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED, statusCode: 400 });
      expect(deps.accessControlService.replaceUserRoles).not.toHaveBeenCalled();
    });

    it("rejects an actor outside the target user's organization", async () => {
      const deps = buildUseCase({ actorMembership: null });

      await expect(
        deps.useCase.execute(organizationAdmin(), "user-target", ORG_CUSTOM_ROLE.id, ORG_A),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN, statusCode: 403 });
      expect(deps.accessControlService.getRoleById).not.toHaveBeenCalled();
    });

    it("rejects an actor without an organization context", async () => {
      const deps = buildUseCase();

      await expect(
        deps.useCase.execute(actor({ organizationId: null }), "user-target", USER_ROLE.id, null),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN, statusCode: 403 });
      expect(deps.accessControlService.replaceUserRoles).not.toHaveBeenCalled();
    });

    it("refuses to change the actor's own roles", async () => {
      const deps = buildUseCase();

      await expect(
        deps.useCase.execute(superAdmin(), "admin-1", USER_ROLE.id, null),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN, statusCode: 403 });
      expect(deps.accessControlService.getRoleById).not.toHaveBeenCalled();
    });

    it("reports a missing user as NOT_FOUND before resolving the role", async () => {
      const deps = buildUseCase({ target: null });

      await expect(
        deps.useCase.execute(superAdmin(), "user-missing", USER_ROLE.id, null),
      ).rejects.toMatchObject({ code: USER_ERROR_CODES.USER_NOT_FOUND, statusCode: 404 });
      expect(deps.accessControlService.getRoleById).not.toHaveBeenCalled();
    });

    it("reports an unknown role id as VALIDATION_FAILED", async () => {
      const deps = buildUseCase({ role: null });

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", "role-missing", null),
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED, statusCode: 400 });
      expect(deps.transactionPort.run).not.toHaveBeenCalled();
    });

    it("does not touch the profile cache when the transaction fails", async () => {
      const deps = buildUseCase({ role: ORG_CUSTOM_ROLE });
      deps.organizationMembership.addMember.mockRejectedValueOnce(new Error("membership failed"));

      await expect(
        deps.useCase.execute(superAdmin(), "user-target", ORG_CUSTOM_ROLE.id, ORG_A),
      ).rejects.toThrow("membership failed");

      expect(deps.profileInvalidator.invalidateAccessProfile).not.toHaveBeenCalled();
      expect(deps.getUserUseCase.execute).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).not.toHaveBeenCalled();
    });
  });
});
