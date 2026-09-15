import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { USER_ERROR_CODES, type CreateUserInput } from "@repo/feature-users/contracts";

import { CreateAdminUserUseCase } from "../create-admin-user.use-case";

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

const actor = (overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser => ({
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.com",
  displayName: "Admin",
  status: "ACTIVE",
  roles: [ROLE_NAMES.USER],
  permissions: [],
  organizationId: null,
  ...overrides,
});

const superAdmin = () => actor({ roles: [ROLE_NAMES.SUPER_ADMIN] });
const organizationAdmin = () =>
  actor({ roles: [ROLE_NAMES.ADMIN], organizationId: ORG_A, permissions: ["users.create"] });

const userProfile = { id: "user-new", email: "created@example.com" };

const requestContext = { requestId: "req-1", ipAddress: "203.0.113.10", userAgent: "vitest" };

function buildUseCase(
  options: {
    existingUser?: { id: string; email: string } | null;
    userRole?: typeof USER_ROLE | null;
    roleById?: unknown;
  } = {},
) {
  const transaction = { id: "tx-1" };
  const createdAt = new Date("2026-01-01T00:00:00.000Z");

  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(transaction)),
  };
  const usersRepository = {
    findByEmail: vi.fn(async () => options.existingUser ?? null),
    create: vi.fn(async (values: CreateUserInput) => ({
      id: "user-new",
      email: values.email,
      passwordHash: values.passwordHash,
      displayName: values.displayName,
      avatarUrl: values.avatarUrl ?? null,
      avatarFileId: null,
      status: values.status ?? "ACTIVE",
      emailVerifiedAt: values.emailVerifiedAt ?? null,
      mustChangePassword: values.mustChangePassword ?? false,
      deletedAt: null,
      createdAt,
      updatedAt: createdAt,
    })),
  };
  const accessControlService = {
    getRoleByName: vi.fn(async () =>
      options.userRole === undefined ? USER_ROLE : options.userRole,
    ),
    getRoleById: vi.fn(async () => (options.roleById === undefined ? USER_ROLE : options.roleById)),
    getOrganizationRoleByName: vi.fn(async () => ORG_ADMIN_ROLE),
    ensureOrganizationAdminRole: vi.fn(async () => undefined),
    replaceUserRoles: vi.fn(async () => undefined),
    assertCanAssignUserRoles: vi.fn(),
    assertCanManageUserAccount: vi.fn(),
  };
  const profileInvalidator = { invalidateAccessProfile: vi.fn(async () => undefined) };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const personalOrganizationProvisioner = {
    ensurePersonalOrganization: vi.fn(async () => "org-personal"),
  };
  const organizationMembership = {
    addMember: vi.fn(async () => null),
    findMembership: vi.fn(async (): Promise<unknown> => null),
  };
  const outbox = { append: vi.fn(async () => undefined) };
  const activityEmitter = { emit: vi.fn(async () => undefined) };
  const getUserUseCase = { execute: vi.fn(async () => userProfile) };

  return {
    transaction,
    transactionPort,
    usersRepository,
    accessControlService,
    profileInvalidator,
    auditWriter,
    personalOrganizationProvisioner,
    organizationMembership,
    outbox,
    activityEmitter,
    getUserUseCase,
    useCase: new CreateAdminUserUseCase(
      transactionPort as never,
      usersRepository as never,
      accessControlService as never,
      profileInvalidator as never,
      auditWriter as never,
      personalOrganizationProvisioner as never,
      organizationMembership as never,
      outbox as never,
      activityEmitter as never,
      getUserUseCase as never,
    ),
  };
}

const createInput = {
  email: "created@example.com",
  password: "S3cret-pass",
  displayName: "Created User",
};

describe("CreateAdminUserUseCase", () => {
  describe("successful creation", () => {
    it("creates an ACTIVE user with the platform USER role and returns the user view", async () => {
      const deps = buildUseCase();

      await expect(deps.useCase.execute(superAdmin(), createInput, requestContext)).resolves.toBe(
        userProfile,
      );

      expect(deps.usersRepository.create).toHaveBeenCalledWith(
        {
          email: "created@example.com",
          passwordHash: expect.stringMatching(/^\$argon2/),
          displayName: "Created User",
          avatarUrl: null,
          status: "ACTIVE",
          emailVerifiedAt: expect.any(Date),
          mustChangePassword: true,
        },
        deps.transaction,
      );
      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-new",
        [USER_ROLE.id],
        null,
        deps.transaction,
      );
      expect(deps.getUserUseCase.execute).toHaveBeenCalledWith("user-new", superAdmin());
    });

    it("never stores the submitted password in clear text", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), createInput);

      const [values] = deps.usersRepository.create.mock.calls[0]!;

      expect(values.passwordHash).not.toBe(createInput.password);
      expect(values.passwordHash).not.toContain(createInput.password);
    });

    it("assigns the role only after the user row has been created", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), createInput);

      const createOrder = deps.usersRepository.create.mock.invocationCallOrder[0]!;
      const assignOrder = deps.accessControlService.replaceUserRoles.mock.invocationCallOrder[0]!;

      expect(createOrder).toBeLessThan(assignOrder);
    });

    it("invalidates the access profile and re-reads the user after the transaction commits", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), createInput);

      const commitOrder = deps.transactionPort.run.mock.invocationCallOrder[0]!;

      expect(deps.profileInvalidator.invalidateAccessProfile).toHaveBeenCalledWith("user-new");
      expect(
        deps.profileInvalidator.invalidateAccessProfile.mock.invocationCallOrder[0]!,
      ).toBeGreaterThan(commitOrder);
    });

    it("provisions a personal organization for a platform user without an organization", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), createInput);

      expect(deps.personalOrganizationProvisioner.ensurePersonalOrganization).toHaveBeenCalledWith(
        "user-new",
        "Created User",
        deps.transaction,
      );
      expect(deps.organizationMembership.addMember).not.toHaveBeenCalled();
    });

    it("audits the creation on the platform scope when no organization is involved", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), createInput, requestContext);

      expect(deps.auditWriter.log).toHaveBeenCalledWith(
        {
          actorId: "admin-1",
          action: "admin.user.created",
          entityType: "user",
          entityId: "user-new",
          metadata: {
            email: "created@example.com",
            status: "ACTIVE",
            roleId: USER_ROLE.id,
            roleName: ROLE_NAMES.USER,
            organizationId: null,
          },
          requestContext,
          scope: SYSTEM_SCOPE.PLATFORM,
        },
        deps.transaction,
      );
      expect(deps.activityEmitter.emit).not.toHaveBeenCalled();
    });

    it("normalizes the email before looking up duplicates and inserting", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), {
        ...createInput,
        email: "  Created@Example.COM  ",
      });

      expect(deps.usersRepository.findByEmail).toHaveBeenCalledWith("created@example.com");
      expect(deps.usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: "created@example.com" }),
        deps.transaction,
      );
    });

    it("queues an outbox event and leaves the account unverified for PENDING users", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), { ...createInput, status: "PENDING" });

      expect(deps.usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "PENDING", emailVerifiedAt: null }),
        deps.transaction,
      );
      expect(deps.outbox.append).toHaveBeenCalledWith(
        "user.lifecycle.created",
        {
          userId: "user-new",
          email: "created@example.com",
          displayName: "Created User",
        },
        deps.transaction,
      );
    });
  });

  describe("organization scope", () => {
    it("lets SUPER_ADMIN create an organization ADMIN with membership and the org admin role", async () => {
      const deps = buildUseCase({ roleById: ORG_ADMIN_ROLE });

      await deps.useCase.execute(superAdmin(), {
        ...createInput,
        roleId: ORG_ADMIN_ROLE.id,
        organizationId: ORG_A,
      });

      expect(deps.organizationMembership.addMember).toHaveBeenCalledWith(
        { organizationId: ORG_A, userId: "user-new", role: "ADMIN" },
        deps.transaction,
      );
      expect(deps.accessControlService.ensureOrganizationAdminRole).toHaveBeenCalledWith(
        ORG_A,
        "user-new",
        deps.transaction,
      );
      // The org ADMIN role is granted by ensureOrganizationAdminRole; assigning
      // it a second time through replaceUserRoles would duplicate the grant.
      expect(deps.accessControlService.replaceUserRoles).not.toHaveBeenCalled();
      expect(
        deps.personalOrganizationProvisioner.ensurePersonalOrganization,
      ).not.toHaveBeenCalled();
    });

    it("adds a MEMBER membership when the new user has none in the organization", async () => {
      const deps = buildUseCase({ roleById: ORG_CUSTOM_ROLE });

      await deps.useCase.execute(superAdmin(), {
        ...createInput,
        roleId: ORG_CUSTOM_ROLE.id,
        organizationId: ORG_A,
      });

      expect(deps.organizationMembership.addMember).toHaveBeenCalledWith(
        { organizationId: ORG_A, userId: "user-new", role: "MEMBER" },
        deps.transaction,
      );
      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-new",
        [ORG_CUSTOM_ROLE.id],
        ORG_A,
        deps.transaction,
      );
    });

    it("keeps an existing membership untouched", async () => {
      const deps = buildUseCase({ roleById: ORG_CUSTOM_ROLE });
      deps.organizationMembership.findMembership.mockResolvedValueOnce({
        organizationId: ORG_A,
        userId: "user-new",
        role: "MEMBER",
      });

      await deps.useCase.execute(superAdmin(), {
        ...createInput,
        roleId: ORG_CUSTOM_ROLE.id,
        organizationId: ORG_A,
      });

      expect(deps.organizationMembership.addMember).not.toHaveBeenCalled();
    });

    it("audits on the organization scope and emits an activity for an organization actor", async () => {
      const deps = buildUseCase({ roleById: ORG_CUSTOM_ROLE });

      await deps.useCase.execute(superAdmin(), {
        ...createInput,
        roleId: ORG_CUSTOM_ROLE.id,
        organizationId: ORG_A,
      });

      expect(deps.auditWriter.log).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: SYSTEM_SCOPE.ORGANIZATION,
          organizationId: ORG_A,
          metadata: expect.objectContaining({ organizationId: ORG_A }),
        }),
        deps.transaction,
      );
      expect(deps.activityEmitter.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          entityType: "user",
          entityId: "user-new",
          actorId: "admin-1",
          visibility: "INTERNAL",
        }),
        deps.transaction,
      );
    });

    it("rejects a role that belongs to a different organization", async () => {
      const deps = buildUseCase({ roleById: OTHER_ORG_ROLE });

      await expect(
        deps.useCase.execute(superAdmin(), {
          ...createInput,
          roleId: OTHER_ORG_ROLE.id,
          organizationId: ORG_A,
        }),
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED, statusCode: 400 });
      expect(deps.accessControlService.replaceUserRoles).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).not.toHaveBeenCalled();
    });

    it("ignores a submitted organization for a non-super actor and uses the actor organization", async () => {
      const deps = buildUseCase({ roleById: ORG_CUSTOM_ROLE });

      await deps.useCase.execute(organizationAdmin(), {
        ...createInput,
        roleId: ORG_CUSTOM_ROLE.id,
        organizationId: ORG_B,
      });

      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-new",
        [ORG_CUSTOM_ROLE.id],
        ORG_A,
        deps.transaction,
      );
      expect(deps.organizationMembership.addMember).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: ORG_A }),
        deps.transaction,
      );
      expect(
        deps.personalOrganizationProvisioner.ensurePersonalOrganization,
      ).not.toHaveBeenCalled();
    });

    it("lets an organization admin create a user in their own organization", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(organizationAdmin(), createInput);

      expect(deps.accessControlService.replaceUserRoles).toHaveBeenCalledWith(
        "user-new",
        [USER_ROLE.id],
        null,
        deps.transaction,
      );
      expect(deps.organizationMembership.addMember).toHaveBeenCalledWith(
        { organizationId: ORG_A, userId: "user-new", role: "MEMBER" },
        deps.transaction,
      );
    });

    it("refuses the ADMIN role for a non-super actor", async () => {
      const deps = buildUseCase({ roleById: ORG_ADMIN_ROLE });

      await expect(
        deps.useCase.execute(organizationAdmin(), {
          ...createInput,
          roleId: ORG_ADMIN_ROLE.id,
          organizationId: ORG_A,
        }),
      ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
      expect(deps.organizationMembership.addMember).not.toHaveBeenCalled();
      expect(deps.accessControlService.ensureOrganizationAdminRole).not.toHaveBeenCalled();
    });
  });

  describe("invalid input and failures", () => {
    it("rejects a duplicate email before opening the transaction", async () => {
      const deps = buildUseCase({
        existingUser: { id: "user-existing", email: "created@example.com" },
      });

      await expect(deps.useCase.execute(superAdmin(), createInput)).rejects.toMatchObject({
        code: USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
        statusCode: 409,
      });
      expect(deps.transactionPort.run).not.toHaveBeenCalled();
      expect(deps.usersRepository.create).not.toHaveBeenCalled();
    });

    it("detects a duplicate through a differently cased email", async () => {
      const deps = buildUseCase({
        existingUser: { id: "user-existing", email: "created@example.com" },
      });

      await expect(
        deps.useCase.execute(superAdmin(), { ...createInput, email: "CREATED@example.com" }),
      ).rejects.toMatchObject({ code: USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS });
    });

    it("fails when the platform USER role is missing", async () => {
      const deps = buildUseCase({ userRole: null });

      await expect(deps.useCase.execute(superAdmin(), createInput)).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
        statusCode: 500,
      });
      expect(deps.accessControlService.replaceUserRoles).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).not.toHaveBeenCalled();
    });

    it("fails when the requested role id does not exist", async () => {
      const deps = buildUseCase({ roleById: null });

      await expect(deps.useCase.execute(superAdmin(), createInput)).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_FAILED,
        statusCode: 400,
      });
      expect(deps.accessControlService.replaceUserRoles).not.toHaveBeenCalled();
    });

    it("performs no role assignment, no audit, and no profile invalidation when creation fails", async () => {
      const deps = buildUseCase();
      deps.usersRepository.create.mockRejectedValueOnce(new Error("insert failed"));

      await expect(deps.useCase.execute(superAdmin(), createInput)).rejects.toThrow(
        "insert failed",
      );

      expect(deps.accessControlService.replaceUserRoles).not.toHaveBeenCalled();
      expect(deps.accessControlService.ensureOrganizationAdminRole).not.toHaveBeenCalled();
      expect(deps.organizationMembership.addMember).not.toHaveBeenCalled();
      expect(
        deps.personalOrganizationProvisioner.ensurePersonalOrganization,
      ).not.toHaveBeenCalled();
      expect(deps.auditWriter.log).not.toHaveBeenCalled();
      expect(deps.outbox.append).not.toHaveBeenCalled();
      expect(deps.activityEmitter.emit).not.toHaveBeenCalled();
      expect(deps.profileInvalidator.invalidateAccessProfile).not.toHaveBeenCalled();
      expect(deps.getUserUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
