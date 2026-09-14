import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ListOrganizationsForUserUseCase } from "../list-organizations-for-user.use-case";

const CURRENT_ORGANIZATION_ID = "org-1";

const actor = (overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser => ({
  userId: "user-1",
  sessionId: "session-1",
  email: "user@example.com",
  displayName: "User",
  status: "ACTIVE",
  roles: ["USER"],
  permissions: [],
  organizationId: CURRENT_ORGANIZATION_ID,
  ...overrides,
});

const organizationRecords = [
  {
    id: "org-1",
    name: "Org One",
    slug: "org-one",
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    id: "org-2",
    name: "Org Two",
    slug: "org-two",
    deletedAt: null,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
];

const membershipRecords = [
  {
    id: "org-1",
    name: "Org One",
    slug: "org-one",
    role: "OWNER" as const,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    id: "org-2",
    name: "Org Two",
    slug: "org-two",
    role: "MEMBER" as const,
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
];

function buildUseCase(
  options: {
    organizations?: typeof organizationRecords;
    memberships?: typeof membershipRecords;
  } = {},
) {
  const organizationsRepository = {
    listAll: vi.fn(async () => options.organizations ?? organizationRecords),
  };
  const organizationMembership = {
    listForUser: vi.fn(async () => options.memberships ?? membershipRecords),
  };

  return {
    organizationsRepository,
    organizationMembership,
    useCase: new ListOrganizationsForUserUseCase(
      organizationsRepository as never,
      organizationMembership as never,
    ),
  };
}

describe("ListOrganizationsForUserUseCase", () => {
  it("lists every organization for SUPER_ADMIN with an ADMIN role and the current flag", async () => {
    const { useCase, organizationsRepository, organizationMembership } = buildUseCase();

    await expect(
      useCase.execute(actor({ roles: ["SUPER_ADMIN"], organizationId: CURRENT_ORGANIZATION_ID })),
    ).resolves.toEqual([
      {
        id: "org-1",
        name: "Org One",
        slug: "org-one",
        role: "ADMIN",
        createdAt: organizationRecords[0]!.createdAt.toISOString(),
        updatedAt: organizationRecords[0]!.updatedAt.toISOString(),
        current: true,
      },
      {
        id: "org-2",
        name: "Org Two",
        slug: "org-two",
        role: "ADMIN",
        createdAt: organizationRecords[1]!.createdAt.toISOString(),
        updatedAt: organizationRecords[1]!.updatedAt.toISOString(),
        current: false,
      },
    ]);
    expect(organizationMembership.listForUser).not.toHaveBeenCalled();
  });

  it("narrows SUPER_ADMIN to membership rows when memberOnly is set", async () => {
    const { useCase, organizationsRepository, organizationMembership } = buildUseCase();

    const result = await useCase.execute(
      actor({ roles: ["SUPER_ADMIN"], organizationId: CURRENT_ORGANIZATION_ID }),
      true,
    );

    expect(organizationsRepository.listAll).not.toHaveBeenCalled();
    expect(organizationMembership.listForUser).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([
      expect.objectContaining({ id: "org-1", role: "OWNER", current: true }),
      expect.objectContaining({ id: "org-2", role: "MEMBER", current: false }),
    ]);
  });

  it("lists the actor's memberships with the membership role for a regular user", async () => {
    const { useCase, organizationsRepository, organizationMembership } = buildUseCase();

    const result = await useCase.execute(actor());

    expect(organizationsRepository.listAll).not.toHaveBeenCalled();
    expect(organizationMembership.listForUser).toHaveBeenCalledWith("user-1");
    expect(result.map((organization) => organization.role)).toEqual(["OWNER", "MEMBER"]);
  });

  it("marks no organization as current when the actor has no organization context", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute(actor({ organizationId: null }));

    expect(result.every((organization) => organization.current === false)).toBe(true);
  });

  it("returns an empty list for a user without memberships", async () => {
    const { useCase } = buildUseCase({ memberships: [] });

    await expect(useCase.execute(actor())).resolves.toEqual([]);
  });
});
