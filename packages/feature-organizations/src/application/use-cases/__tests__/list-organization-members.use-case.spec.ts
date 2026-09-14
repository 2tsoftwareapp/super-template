import { describe, expect, it, vi } from "vitest";

import { ListOrganizationMembersUseCase } from "../list-organization-members.use-case";

const ORGANIZATION_ID = "org-1";
const ACTOR_ID = "user-1";

const memberRecords = [
  {
    userId: "user-1",
    role: "OWNER" as const,
    email: "owner@example.com",
    displayName: "Owner",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  },
  {
    userId: "user-2",
    role: "MEMBER" as const,
    email: "member@example.com",
    displayName: "Member",
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
    updatedAt: new Date("2026-01-04T00:00:00.000Z"),
  },
];

function buildUseCase(options: { membership?: unknown; members?: typeof memberRecords } = {}) {
  const membership = options.membership === undefined ? { role: "ADMIN" } : options.membership;
  const members = options.members ?? memberRecords;

  const organizationMembership = {
    findMembership: vi.fn(async () => membership),
    listMembers: vi.fn(async () => members),
  };

  return {
    organizationMembership,
    useCase: new ListOrganizationMembersUseCase(organizationMembership as never),
  };
}

describe("ListOrganizationMembersUseCase", () => {
  it("returns the serialized member list to a member of the organization", async () => {
    const { useCase, organizationMembership } = buildUseCase();

    await expect(useCase.execute(ORGANIZATION_ID, ACTOR_ID)).resolves.toEqual([
      {
        userId: "user-1",
        email: "owner@example.com",
        displayName: "Owner",
        role: "OWNER",
        createdAt: memberRecords[0]!.createdAt.toISOString(),
        updatedAt: memberRecords[0]!.updatedAt.toISOString(),
      },
      {
        userId: "user-2",
        email: "member@example.com",
        displayName: "Member",
        role: "MEMBER",
        createdAt: memberRecords[1]!.createdAt.toISOString(),
        updatedAt: memberRecords[1]!.updatedAt.toISOString(),
      },
    ]);
    expect(organizationMembership.findMembership).toHaveBeenCalledWith(ORGANIZATION_ID, ACTOR_ID);
    expect(organizationMembership.listMembers).toHaveBeenCalledWith(ORGANIZATION_ID);
  });

  it("forbids a non-member before listing any member", async () => {
    const { useCase, organizationMembership } = buildUseCase({ membership: null });

    await expect(useCase.execute(ORGANIZATION_ID, ACTOR_ID)).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
      statusCode: 403,
    });
    expect(organizationMembership.listMembers).not.toHaveBeenCalled();
  });

  it("lets SUPER_ADMIN list members without a membership row", async () => {
    const { useCase, organizationMembership } = buildUseCase({ membership: null });

    const result = await useCase.execute(ORGANIZATION_ID, {
      userId: ACTOR_ID,
      sessionId: "session-1",
      email: "super@example.com",
      displayName: "Super",
      status: "ACTIVE",
      roles: ["SUPER_ADMIN"],
      permissions: [],
      organizationId: null,
    });

    expect(organizationMembership.findMembership).not.toHaveBeenCalled();
    expect(result).toHaveLength(memberRecords.length);
  });

  it("returns an empty list when the organization has no members", async () => {
    const { useCase } = buildUseCase({ members: [] });

    await expect(useCase.execute(ORGANIZATION_ID, ACTOR_ID)).resolves.toEqual([]);
  });
});
