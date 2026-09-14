import { ORGANIZATION_ERROR_CODES } from "@repo/feature-organizations/contracts";
import { describe, expect, it, vi } from "vitest";

import { GetOrganizationUseCase } from "../get-organization.use-case";

const ORGANIZATION_ID = "org-1";
const ACTOR_ID = "user-1";

const organizationRecord = {
  id: ORGANIZATION_ID,
  name: "Org One",
  slug: "org-one",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

function buildUseCase(
  options: { organization?: typeof organizationRecord | null; membership?: unknown } = {},
) {
  const organization =
    options.organization === undefined ? organizationRecord : options.organization;
  const membership =
    options.membership === undefined
      ? { organizationId: ORGANIZATION_ID, userId: ACTOR_ID, role: "ADMIN" as const }
      : options.membership;

  const organizationsRepository = {
    findById: vi.fn(async () => organization),
  };
  const organizationMembership = {
    findMembership: vi.fn(async () => membership),
    countMembers: vi.fn(async () => 3),
  };

  return {
    organizationsRepository,
    organizationMembership,
    useCase: new GetOrganizationUseCase(
      organizationsRepository as never,
      organizationMembership as never,
    ),
  };
}

describe("GetOrganizationUseCase", () => {
  it("returns the organization with the actor role and member count", async () => {
    const { useCase, organizationMembership } = buildUseCase();

    await expect(useCase.execute(ORGANIZATION_ID, ACTOR_ID)).resolves.toEqual({
      id: ORGANIZATION_ID,
      name: "Org One",
      slug: "org-one",
      role: "ADMIN",
      memberCount: 3,
      createdAt: organizationRecord.createdAt.toISOString(),
      updatedAt: organizationRecord.updatedAt.toISOString(),
    });
    expect(organizationMembership.findMembership).toHaveBeenCalledWith(ORGANIZATION_ID, ACTOR_ID);
  });

  it("forbids a non-member before reading the organization", async () => {
    const { useCase, organizationsRepository } = buildUseCase({ membership: null });

    await expect(useCase.execute(ORGANIZATION_ID, ACTOR_ID)).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
      statusCode: 403,
    });
    expect(organizationsRepository.findById).not.toHaveBeenCalled();
  });

  it("reports a missing organization as NOT_FOUND", async () => {
    const { useCase } = buildUseCase({ organization: null });

    await expect(useCase.execute(ORGANIZATION_ID, ACTOR_ID)).rejects.toMatchObject({
      code: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("lets SUPER_ADMIN read any organization without a membership row", async () => {
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
    expect(result.role).toBe("ADMIN");
  });

  it("keeps the membership lookup for a non-super actor carrying a request user", async () => {
    const { useCase, organizationMembership } = buildUseCase({
      membership: { organizationId: ORGANIZATION_ID, userId: ACTOR_ID, role: "MEMBER" as const },
    });

    const result = await useCase.execute(ORGANIZATION_ID, {
      userId: ACTOR_ID,
      sessionId: "session-1",
      email: "member@example.com",
      displayName: "Member",
      status: "ACTIVE",
      roles: ["USER"],
      permissions: [],
      organizationId: ORGANIZATION_ID,
    });

    expect(organizationMembership.findMembership).toHaveBeenCalledWith(ORGANIZATION_ID, ACTOR_ID);
    expect(result.role).toBe("MEMBER");
  });
});
