import { DEFAULT_ORGANIZATION_MODEL_OPTIONS } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import { AssertOrganizationMembershipUseCase } from "../assert-organization-membership.use-case";
import { ResolveOrganizationIdForUserUseCase } from "../resolve-organization-id-for-user.use-case";

const USER_ID = "user-1";
const REQUESTED_ORGANIZATION_ID = "org-2";
const PRIMARY_ORGANIZATION_ID = "org-1";

const organizationRecord = {
  id: REQUESTED_ORGANIZATION_ID,
  name: "Org Two",
  slug: "org-two",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const membershipRecord = {
  organizationId: REQUESTED_ORGANIZATION_ID,
  userId: USER_ID,
  role: "MEMBER" as const,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function buildUseCase(
  options: {
    organization?: typeof organizationRecord | null;
    membership?: typeof membershipRecord | null;
    primaryOrganizationId?: string | null;
    organizationModel?: "personal-orgs" | "org-optional";
  } = {},
) {
  const organization =
    options.organization === undefined ? organizationRecord : options.organization;
  const membership = options.membership === undefined ? membershipRecord : options.membership;
  const primaryOrganizationId =
    options.primaryOrganizationId === undefined
      ? PRIMARY_ORGANIZATION_ID
      : options.primaryOrganizationId;

  const organizationsRepository = {
    findById: vi.fn(async () => organization),
  };
  const organizationMembership = {
    findMembership: vi.fn(async () => membership),
    findPrimaryOrganizationId: vi.fn(async () => primaryOrganizationId),
  };
  const assertOrganizationMembershipUseCase = new AssertOrganizationMembershipUseCase(
    organizationsRepository as never,
    organizationMembership as never,
  );

  return {
    organizationsRepository,
    organizationMembership,
    useCase: new ResolveOrganizationIdForUserUseCase(
      organizationMembership as never,
      assertOrganizationMembershipUseCase,
      {
        organizationModel:
          options.organizationModel ?? DEFAULT_ORGANIZATION_MODEL_OPTIONS.organizationModel,
      },
    ),
  };
}

describe("ResolveOrganizationIdForUserUseCase", () => {
  it("returns the requested organization when the user is a member", async () => {
    const { useCase, organizationMembership } = buildUseCase();

    await expect(useCase.execute(USER_ID, REQUESTED_ORGANIZATION_ID)).resolves.toBe(
      REQUESTED_ORGANIZATION_ID,
    );
    expect(organizationMembership.findMembership).toHaveBeenCalledWith(
      REQUESTED_ORGANIZATION_ID,
      USER_ID,
      undefined,
    );
    expect(organizationMembership.findPrimaryOrganizationId).not.toHaveBeenCalled();
  });

  it("falls back to the primary organization when the user is not a member of the requested one", async () => {
    const { useCase, organizationMembership } = buildUseCase({ membership: null });

    await expect(useCase.execute(USER_ID, REQUESTED_ORGANIZATION_ID)).resolves.toBe(
      PRIMARY_ORGANIZATION_ID,
    );
    expect(organizationMembership.findPrimaryOrganizationId).toHaveBeenCalledWith(
      USER_ID,
      undefined,
    );
  });

  it("falls back to the primary organization when the requested one no longer exists", async () => {
    const { useCase, organizationMembership } = buildUseCase({ organization: null });

    await expect(useCase.execute(USER_ID, REQUESTED_ORGANIZATION_ID)).resolves.toBe(
      PRIMARY_ORGANIZATION_ID,
    );
    expect(organizationMembership.findMembership).not.toHaveBeenCalled();
  });

  it("returns the primary organization when no organization is requested", async () => {
    const { useCase, organizationsRepository, organizationMembership } = buildUseCase();

    await expect(useCase.execute(USER_ID)).resolves.toBe(PRIMARY_ORGANIZATION_ID);
    expect(organizationsRepository.findById).not.toHaveBeenCalled();
    expect(organizationMembership.findPrimaryOrganizationId).toHaveBeenCalledWith(
      USER_ID,
      undefined,
    );
  });

  it("treats a null requested organization like a missing one", async () => {
    const { useCase, organizationsRepository } = buildUseCase();

    await expect(useCase.execute(USER_ID, null)).resolves.toBe(PRIMARY_ORGANIZATION_ID);
    expect(organizationsRepository.findById).not.toHaveBeenCalled();
  });

  it("returns null for the org-optional model when the user has no organization at all", async () => {
    const { useCase } = buildUseCase({
      membership: null,
      primaryOrganizationId: null,
      organizationModel: "org-optional",
    });

    await expect(useCase.execute(USER_ID, REQUESTED_ORGANIZATION_ID)).resolves.toBeNull();
    await expect(useCase.execute(USER_ID, null)).resolves.toBeNull();
  });

  it("forbids the personal-orgs model when the user has no organization at all", async () => {
    const { useCase } = buildUseCase({ membership: null, primaryOrganizationId: null });

    await expect(useCase.execute(USER_ID, REQUESTED_ORGANIZATION_ID)).rejects.toMatchObject({
      code: "AUTH_FORBIDDEN",
      statusCode: 403,
    });
  });

  it("passes the caller executor through every read", async () => {
    const { useCase, organizationsRepository, organizationMembership } = buildUseCase();
    const executor = { id: "tx-1" } as never;

    await useCase.execute(USER_ID, REQUESTED_ORGANIZATION_ID, executor);

    expect(organizationsRepository.findById).toHaveBeenCalledWith(
      REQUESTED_ORGANIZATION_ID,
      executor,
    );
    expect(organizationMembership.findMembership).toHaveBeenCalledWith(
      REQUESTED_ORGANIZATION_ID,
      USER_ID,
      executor,
    );

    organizationMembership.findPrimaryOrganizationId.mockClear();
    await useCase.execute(USER_ID, null, executor);
    expect(organizationMembership.findPrimaryOrganizationId).toHaveBeenCalledWith(
      USER_ID,
      executor,
    );
  });
});
