import type { AuthenticatedRequestUser } from "@repo/api-kernel";
import type { ListUsersQuery, UserRecord, UsersCoreListQuery } from "@repo/feature-users/contracts";

import { describe, expect, it, vi } from "vitest";

import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { UsersMapper } from "@repo/feature-users/module";

import { ListUsersUseCase } from "../list-users.use-case";

const ORG_A = "org-a";

const actor = (overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser => ({
  userId: "admin-1",
  sessionId: "session-1",
  email: "admin@example.com",
  displayName: "Admin",
  status: "ACTIVE",
  roles: [ROLE_NAMES.ADMIN],
  permissions: [],
  organizationId: ORG_A,
  ...overrides,
});

const superAdmin = () => actor({ roles: [ROLE_NAMES.SUPER_ADMIN], organizationId: null });

const userRow = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: "user-1",
  email: "user@example.com",
  passwordHash: "hash",
  displayName: "User",
  avatarUrl: null,
  avatarFileId: null,
  status: "ACTIVE",
  emailVerifiedAt: null,
  mustChangePassword: false,
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const query: ListUsersQuery = {
  page: 1,
  limit: 20,
  sort: [{ field: "createdAt", order: "desc" }],
};

function buildUseCase(
  options: {
    rows?: UserRecord[];
    total?: number;
    orgMemberIds?: string[];
    roleUserIds?: string[];
    roleNames?: Map<string, string[]>;
    roleIds?: Map<string, string[]>;
  } = {},
) {
  const usersRepository = {
    list: vi.fn(async () => ({ rows: options.rows ?? [], total: options.total ?? 0 })),
  };
  const accessControlService = {
    getUserIdsForRole: vi.fn(async () => options.roleUserIds ?? []),
    getRoleNamesForUsers: vi.fn(async () => options.roleNames ?? new Map<string, string[]>()),
    getRoleIdsForUsers: vi.fn(async () => options.roleIds ?? new Map<string, string[]>()),
  };
  const organizationMembership = {
    findUserIdsForOrganization: vi.fn(async () => options.orgMemberIds ?? []),
  };

  return {
    usersRepository,
    accessControlService,
    organizationMembership,
    useCase: new ListUsersUseCase(
      usersRepository as never,
      accessControlService as never,
      organizationMembership as never,
      new UsersMapper(),
    ),
  };
}

/** The list query the repository was asked for. */
function listParams(usersRepository: { list: { mock: { calls: unknown[][] } } }, callIndex = 0) {
  return usersRepository.list.mock.calls[callIndex]![0] as UsersCoreListQuery;
}

describe("ListUsersUseCase", () => {
  describe("organization scope", () => {
    it("restricts an organization actor to the organization's member ids", async () => {
      const deps = buildUseCase({ orgMemberIds: ["user-1", "user-2"] });

      await deps.useCase.execute(actor(), query);

      expect(deps.organizationMembership.findUserIdsForOrganization).toHaveBeenCalledWith(ORG_A);
      expect(listParams(deps.usersRepository)).toEqual({
        page: 1,
        limit: 20,
        sort: query.sort,
        candidateUserIds: ["user-1", "user-2"],
      });
      expect(deps.accessControlService.getRoleNamesForUsers).toHaveBeenCalledWith([], ORG_A);
    });

    it("returns an empty page without listing when the organization has no members", async () => {
      const deps = buildUseCase({ orgMemberIds: [] });

      await expect(deps.useCase.execute(actor(), query)).resolves.toEqual({ rows: [], total: 0 });
      expect(deps.usersRepository.list).not.toHaveBeenCalled();
    });

    it("forbids a non-super actor without an organization context", async () => {
      const deps = buildUseCase();

      await expect(
        deps.useCase.execute(actor({ organizationId: null }), query),
      ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
      expect(deps.usersRepository.list).not.toHaveBeenCalled();
    });

    it("does not constrain SUPER_ADMIN to an organization", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), query);

      expect(deps.organizationMembership.findUserIdsForOrganization).not.toHaveBeenCalled();
      expect(listParams(deps.usersRepository).candidateUserIds).toBeUndefined();
      expect(deps.accessControlService.getRoleNamesForUsers).toHaveBeenCalledWith([], undefined);
    });
  });

  describe("role filter", () => {
    it("intersects the role members with the organization members", async () => {
      const deps = buildUseCase({
        orgMemberIds: ["user-1", "user-2"],
        roleUserIds: ["user-2", "user-3"],
      });

      await deps.useCase.execute(actor(), { ...query, role: "ACCOUNTANT" });

      expect(deps.accessControlService.getUserIdsForRole).toHaveBeenCalledWith("ACCOUNTANT", ORG_A);
      expect(listParams(deps.usersRepository).candidateUserIds).toEqual(["user-2"]);
    });

    it("returns an empty page when the organization has nobody with the role", async () => {
      const deps = buildUseCase({ orgMemberIds: ["user-1"], roleUserIds: ["user-3"] });

      await expect(
        deps.useCase.execute(actor(), { ...query, role: "ACCOUNTANT" }),
      ).resolves.toEqual({ rows: [], total: 0 });
      expect(deps.usersRepository.list).not.toHaveBeenCalled();
    });

    it("uses the role members as the only constraint for SUPER_ADMIN", async () => {
      const deps = buildUseCase({ roleUserIds: ["user-2"] });

      await deps.useCase.execute(superAdmin(), { ...query, role: "ACCOUNTANT" });

      expect(deps.accessControlService.getUserIdsForRole).toHaveBeenCalledWith(
        "ACCOUNTANT",
        undefined,
      );
      expect(listParams(deps.usersRepository).candidateUserIds).toEqual(["user-2"]);
    });

    it("returns an empty page when nobody holds the role", async () => {
      const deps = buildUseCase({ roleUserIds: [] });

      await expect(
        deps.useCase.execute(superAdmin(), { ...query, role: "ACCOUNTANT" }),
      ).resolves.toEqual({ rows: [], total: 0 });
      expect(deps.usersRepository.list).not.toHaveBeenCalled();
    });
  });

  describe("list parameters and mapping", () => {
    it("forwards search and status and omits them when absent", async () => {
      const deps = buildUseCase();

      await deps.useCase.execute(superAdmin(), {
        ...query,
        search: "ada",
        status: "BLOCKED",
      });

      expect(listParams(deps.usersRepository)).toEqual({
        page: 1,
        limit: 20,
        sort: query.sort,
        search: "ada",
        status: "BLOCKED",
      });

      await deps.useCase.execute(superAdmin(), query);
      expect(listParams(deps.usersRepository, 1)).not.toHaveProperty("search");
      expect(listParams(deps.usersRepository, 1)).not.toHaveProperty("status");
    });

    it("maps rows to user views with their roles and role ids", async () => {
      const rows = [userRow({ id: "user-1" }), userRow({ id: "user-2" })];
      const deps = buildUseCase({
        rows,
        total: 2,
        roleNames: new Map([
          ["user-1", ["ACCOUNTANT"]],
          ["user-2", []],
        ]),
        roleIds: new Map([
          ["user-1", ["role-accountant"]],
          ["user-2", []],
        ]),
      });

      const result = await deps.useCase.execute(superAdmin(), query);

      expect(result.total).toBe(2);
      expect(result.rows[0]).toMatchObject({
        id: "user-1",
        roles: ["ACCOUNTANT"],
        roleIds: ["role-accountant"],
      });
      expect(result.rows[1]).toMatchObject({ id: "user-2", roles: [], roleIds: [] });
      expect(deps.accessControlService.getRoleNamesForUsers).toHaveBeenCalledWith(
        ["user-1", "user-2"],
        undefined,
      );
      expect(deps.accessControlService.getRoleIdsForUsers).toHaveBeenCalledWith(
        ["user-1", "user-2"],
        undefined,
      );
    });

    it("returns an empty page when the repository has no rows", async () => {
      const deps = buildUseCase();

      await expect(deps.useCase.execute(superAdmin(), query)).resolves.toEqual({
        rows: [],
        total: 0,
      });
    });
  });
});
