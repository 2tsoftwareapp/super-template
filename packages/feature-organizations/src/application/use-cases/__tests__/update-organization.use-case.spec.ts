import type { AuthenticatedRequestUser, TenantContext } from "@repo/api-kernel";

import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { ORGANIZATION_ERROR_CODES } from "@repo/feature-organizations/contracts";
import { describe, expect, it, vi } from "vitest";

import { UpdateOrganizationUseCase } from "../update-organization.use-case";

const ORGANIZATION_ID = "org-1";
const ACTOR_ID = "user-1";

const actor = (overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser => ({
  userId: ACTOR_ID,
  sessionId: "session-1",
  email: "admin@example.com",
  displayName: "Admin",
  status: "ACTIVE",
  roles: ["USER"],
  permissions: [],
  organizationId: ORGANIZATION_ID,
  ...overrides,
});

const renamedRecord = {
  id: ORGANIZATION_ID,
  name: "Renamed Org",
  slug: "org-one",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

function buildUseCase(
  options: { membership?: unknown; updated?: typeof renamedRecord | null } = {},
) {
  const membership =
    options.membership === undefined
      ? { organizationId: ORGANIZATION_ID, userId: ACTOR_ID, role: "ADMIN" as const }
      : options.membership;
  const updated = options.updated === undefined ? renamedRecord : options.updated;

  const transaction = { id: "tx-1" };
  const transactionPort = {
    withTenant: vi.fn(
      async (_context: TenantContext, fn: (executor: unknown) => Promise<unknown>) =>
        fn(transaction),
    ),
  };
  const organizationsRepository = {
    updateOrganization: vi.fn(async () => updated),
  };
  const organizationMembership = {
    findMembership: vi.fn(async () => membership),
  };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const activityEmitter = { emit: vi.fn(async () => undefined) };

  return {
    transaction,
    transactionPort,
    organizationsRepository,
    organizationMembership,
    auditWriter,
    activityEmitter,
    useCase: new UpdateOrganizationUseCase(
      transactionPort as never,
      organizationsRepository as never,
      organizationMembership as never,
      auditWriter as never,
      activityEmitter as never,
    ),
  };
}

describe("UpdateOrganizationUseCase", () => {
  it("renames the organization for an ADMIN member with the actor tenant context", async () => {
    const {
      useCase,
      transaction,
      transactionPort,
      organizationsRepository,
      auditWriter,
      activityEmitter,
    } = buildUseCase();

    await expect(
      useCase.execute(ORGANIZATION_ID, actor(), { name: "Renamed Org" }),
    ).resolves.toEqual({
      id: ORGANIZATION_ID,
      name: "Renamed Org",
      slug: "org-one",
      role: "ADMIN",
      createdAt: renamedRecord.createdAt.toISOString(),
      updatedAt: renamedRecord.updatedAt.toISOString(),
    });

    expect(transactionPort.withTenant).toHaveBeenCalledWith(
      { tenantId: ORGANIZATION_ID, userId: ACTOR_ID, bypassRls: false },
      expect.any(Function),
    );
    expect(organizationsRepository.updateOrganization).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      { name: "Renamed Org" },
      transaction,
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: ACTOR_ID,
        action: "organization.update",
        entityType: "organization",
        entityId: ORGANIZATION_ID,
        metadata: { name: "Renamed Org" },
        scope: SYSTEM_SCOPE.ORGANIZATION,
        organizationId: ORGANIZATION_ID,
      }),
      transaction,
    );
    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORGANIZATION_ID,
        summary: 'Organization renamed to "Renamed Org"',
        entityType: "organization",
        entityId: ORGANIZATION_ID,
        actorId: ACTOR_ID,
        visibility: "INTERNAL",
      }),
      transaction,
    );
  });

  it("trims the submitted name before writing", async () => {
    const { useCase, organizationsRepository } = buildUseCase();

    await useCase.execute(ORGANIZATION_ID, actor(), { name: "  Renamed Org  " });

    expect(organizationsRepository.updateOrganization).toHaveBeenCalledWith(
      ORGANIZATION_ID,
      { name: "Renamed Org" },
      expect.anything(),
    );
  });

  it("keeps the OWNER membership role in the response", async () => {
    const { useCase } = buildUseCase({
      membership: { organizationId: ORGANIZATION_ID, userId: ACTOR_ID, role: "OWNER" as const },
    });

    await expect(
      useCase.execute(ORGANIZATION_ID, actor(), { name: "Renamed Org" }),
    ).resolves.toMatchObject({ role: "OWNER" });
  });

  it("forbids a MEMBER from renaming before touching the repository", async () => {
    const { useCase, transactionPort, organizationsRepository } = buildUseCase({
      membership: { organizationId: ORGANIZATION_ID, userId: ACTOR_ID, role: "MEMBER" as const },
    });

    await expect(
      useCase.execute(ORGANIZATION_ID, actor(), { name: "Renamed Org" }),
    ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
    expect(transactionPort.withTenant).not.toHaveBeenCalled();
    expect(organizationsRepository.updateOrganization).not.toHaveBeenCalled();
  });

  it("forbids a non-member before touching the repository", async () => {
    const { useCase, organizationsRepository } = buildUseCase({ membership: null });

    await expect(
      useCase.execute(ORGANIZATION_ID, actor(), { name: "Renamed Org" }),
    ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
    expect(organizationsRepository.updateOrganization).not.toHaveBeenCalled();
  });

  it("lets SUPER_ADMIN rename with RLS bypass and without a membership row", async () => {
    const { useCase, transactionPort, organizationMembership } = buildUseCase({
      membership: null,
    });

    const result = await useCase.execute(
      ORGANIZATION_ID,
      actor({ roles: ["SUPER_ADMIN"], organizationId: null }),
      { name: "Renamed Org" },
    );

    expect(organizationMembership.findMembership).not.toHaveBeenCalled();
    expect(transactionPort.withTenant).toHaveBeenCalledWith(
      { tenantId: ORGANIZATION_ID, userId: ACTOR_ID, bypassRls: true },
      expect.any(Function),
    );
    expect(result.role).toBe("ADMIN");
  });

  it("reports NOT_FOUND when the organization disappeared inside the transaction", async () => {
    const { useCase, auditWriter, activityEmitter } = buildUseCase({ updated: null });

    await expect(
      useCase.execute(ORGANIZATION_ID, actor(), { name: "Renamed Org" }),
    ).rejects.toMatchObject({
      code: ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND,
      statusCode: 404,
    });
    expect(auditWriter.log).not.toHaveBeenCalled();
    expect(activityEmitter.emit).not.toHaveBeenCalled();
  });
});
