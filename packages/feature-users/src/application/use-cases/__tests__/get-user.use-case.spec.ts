import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { describe, expect, it, vi } from "vitest";

import type { OrganizationMembership } from "@repo/api-runtime";
import { UsersMapper } from "../../users.mapper";
import { GetUserUseCase } from "../get-user.use-case";

const userRecord = {
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
} as const;

function makeUseCase() {
  const usersRepository = {
    findById: vi.fn(() => Promise.resolve(userRecord)),
    isUserInOrganization: vi.fn(() => Promise.resolve(true)),
  };
  const accessControlService = {
    getAccessProfile: vi.fn(() => Promise.resolve({ roles: ["ACCOUNTANT"] })),
    getRoleIdsForUser: vi.fn(() => Promise.resolve(["role-accountant"])),
    getRoleAssignmentsForUser: vi.fn(() =>
      Promise.resolve([
        {
          roleId: "role-accountant",
          roleName: "ACCOUNTANT",
          organizationId: "org-a",
        },
      ]),
    ),
  };
  const membership = {
    listForUser: vi.fn(() =>
      Promise.resolve([
        {
          id: "org-a",
          name: "Org A",
          slug: "org-a",
          role: "MEMBER" as const,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          id: "org-b",
          name: "Org B",
          slug: "org-b",
          role: "MEMBER" as const,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]),
    ),
  };

  return {
    usersRepository,
    accessControlService,
    useCase: new GetUserUseCase(
      usersRepository as never,
      accessControlService as never,
      membership as unknown as OrganizationMembership,
      new UsersMapper(),
    ),
  };
}

describe("GetUserUseCase", () => {
  it("scopes memberOrganizationIds to the actor organization for org admins", async () => {
    const { useCase, usersRepository, accessControlService } = makeUseCase();

    const result = await useCase.execute("user-1", {
      userId: "actor-1",
      sessionId: "session-1",
      email: "admin@example.com",
      displayName: "Admin",
      status: "ACTIVE",
      roles: ["ADMIN"],
      permissions: [],
      organizationId: "org-a",
    } satisfies AuthenticatedRequestUser);

    expect(usersRepository.isUserInOrganization).toHaveBeenCalledWith("user-1", "org-a");
    expect(accessControlService.getAccessProfile).toHaveBeenCalledWith("user-1", "org-a");
    expect(result.memberOrganizationIds).toEqual(["org-a"]);
  });

  it("returns all memberOrganizationIds for super admins", async () => {
    const { useCase, accessControlService } = makeUseCase();

    const result = await useCase.execute("user-1", {
      userId: "actor-1",
      sessionId: "session-1",
      email: "super@example.com",
      displayName: "Super",
      status: "ACTIVE",
      roles: ["SUPER_ADMIN"],
      permissions: [],
      organizationId: null,
    } satisfies AuthenticatedRequestUser);

    expect(accessControlService.getAccessProfile).toHaveBeenCalledWith("user-1", undefined);
    expect(result.memberOrganizationIds).toEqual(["org-a", "org-b"]);
  });
});
