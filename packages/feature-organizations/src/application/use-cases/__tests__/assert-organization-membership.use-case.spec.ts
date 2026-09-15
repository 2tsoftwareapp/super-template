import { ORGANIZATION_ERROR_CODES } from "@repo/feature-organizations/contracts";
import { describe, expect, it, vi } from "vitest";

import { AssertOrganizationMembershipUseCase } from "../assert-organization-membership.use-case";

const ORGANIZATION_ID = "org-1";
const USER_ID = "user-1";

const organizationRecord = {
  id: ORGANIZATION_ID,
  name: "Org One",
  slug: "org-one",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const membershipRecord = {
  organizationId: ORGANIZATION_ID,
  userId: USER_ID,
  role: "MEMBER" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function buildUseCase(
  options: { organization?: typeof organizationRecord | null; membership?: unknown } = {},
) {
  const organization =
    options.organization === undefined ? organizationRecord : options.organization;
  const membership = options.membership === undefined ? membershipRecord : options.membership;

  const organizationsRepository = {
    findById: vi.fn(async () => organization),
  };
  const organizationMembership = {
    findMembership: vi.fn(async () => membership),
  };

  return {
    organizationsRepository,
    organizationMembership,
    useCase: new AssertOrganizationMembershipUseCase(
      organizationsRepository as never,
      organizationMembership as never,
    ),
  };
}

describe("AssertOrganizationMembershipUseCase", () => {
  it("returns the membership row for a member of an existing organization", async () => {
    const { useCase, organizationsRepository, organizationMembership } = buildUseCase();

    await expect(useCase.execute(ORGANIZATION_ID, USER_ID)).resolves.toBe(membershipRecord);

    expect(organizationsRepository.findById).toHaveBeenCalledWith(ORGANIZATION_ID, undefined);
    expect(organizationMembership.findMembership).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      USER_ID,
      undefined,
    );
  });

  it("reports a missing organization as NOT_FOUND without checking membership", async () => {
    const { useCase, organizationMembership } = buildUseCase({ organization: null });

    await expect(useCase.execute(ORGANIZATION_ID, USER_ID)).rejects.toMatchObject({
      code: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND,
      statusCode: 404,
    });
    expect(organizationMembership.findMembership).not.toHaveBeenCalled();
  });

  it("forbids a non-member of an existing organization", async () => {
    const { useCase } = buildUseCase({ membership: null });

    await expect(useCase.execute(ORGANIZATION_ID, USER_ID)).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
      statusCode: 403,
    });
  });

  it("passes the caller executor through both reads", async () => {
    const { useCase, organizationsRepository, organizationMembership } = buildUseCase();
    const executor = { id: "tx-1" } as never;

    await useCase.execute(ORGANIZATION_ID, USER_ID, executor);

    expect(organizationsRepository.findById).toHaveBeenCalledWith(ORGANIZATION_ID, executor);
    expect(organizationMembership.findMembership).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      USER_ID,
      executor,
    );
  });
});
