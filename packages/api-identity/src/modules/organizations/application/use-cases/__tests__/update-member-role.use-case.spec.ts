import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-core";

import { UpdateMemberRoleUseCase } from "../update-member-role.use-case";

const transactionPort = {
  run: vi.fn().mockImplementation(async (fn: any) => fn(null)),
  withTenant: vi.fn().mockImplementation(async (tenant: any, fn: any) => fn(null)),
};

const accessControlService = {
  replaceUserRoles: vi.fn(async () => undefined),
  ensureOrganizationAdminRole: vi.fn(async () => undefined),
  invalidateAccessProfile: vi.fn(async () => undefined),
};

const activityEmitter = { emit: vi.fn(async () => undefined) };

function buildRepository(
  overrides: Partial<{
    actorRole: "OWNER" | "ADMIN" | "MEMBER";
    targetRole: "OWNER" | "ADMIN" | "MEMBER";
    remainingOwners: number;
  }> = {},
) {
  const actorRole = overrides.actorRole ?? "OWNER";
  const targetRole = overrides.targetRole ?? "MEMBER";
  const remainingOwners = overrides.remainingOwners ?? 1;

  return {
    findMembership: vi.fn().mockImplementation(async (_orgId: string, userId: string) => {
      if (userId === "actor") {
        return { userId: "actor", role: actorRole };
      }
      if (userId === "target") {
        return { userId: "target", role: targetRole };
      }
      return null;
    }),
    countOwners: vi.fn(async () => remainingOwners),
    updateMemberRole: vi.fn(async (_orgId: string, userId: string, role: string) => ({
      userId,
      role,
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    })),
  };
}

describe("UpdateMemberRoleUseCase", () => {
  it("lets an owner promote a member to admin", async () => {
    const repository = buildRepository({ actorRole: "OWNER", targetRole: "MEMBER" });
    const auditWriter = { log: vi.fn(async () => undefined) };
    activityEmitter.emit.mockClear();
    const useCase = new UpdateMemberRoleUseCase(
      transactionPort as any,
      repository as never,
      auditWriter as never,
      activityEmitter as never,
      accessControlService as any,
    );

    const result = await useCase.execute("org-1", "actor", "target", "ADMIN");

    expect(repository.updateMemberRole).toHaveBeenCalledWith("org-1", "target", "ADMIN", null);
    expect(result.role).toBe("ADMIN");
    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        entityType: "organization",
        entityId: "org-1",
        actorId: "actor",
        metadata: { targetUserId: "target", role: "ADMIN" },
      }),
      null,
    );
  });

  it("blocks an admin from promoting a member to admin", async () => {
    const repository = buildRepository({ actorRole: "ADMIN", targetRole: "MEMBER" });
    const auditWriter = { log: vi.fn() };
    const useCase = new UpdateMemberRoleUseCase(
      transactionPort as any,
      repository as never,
      auditWriter as never,
      activityEmitter as never,
      accessControlService as any,
    );

    await expect(useCase.execute("org-1", "actor", "target", "ADMIN")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });
    expect(repository.updateMemberRole).not.toHaveBeenCalled();
  });

  it("blocks an admin from touching another admin", async () => {
    const repository = buildRepository({ actorRole: "ADMIN", targetRole: "ADMIN" });
    const auditWriter = { log: vi.fn() };
    const useCase = new UpdateMemberRoleUseCase(
      transactionPort as any,
      repository as never,
      auditWriter as never,
      activityEmitter as never,
      accessControlService as any,
    );

    await expect(useCase.execute("org-1", "actor", "target", "MEMBER")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });
  });

  it("blocks demoting the last owner", async () => {
    const repository = buildRepository({
      actorRole: "OWNER",
      targetRole: "OWNER",
      remainingOwners: 0,
    });
    const auditWriter = { log: vi.fn() };
    const useCase = new UpdateMemberRoleUseCase(
      transactionPort as any,
      repository as never,
      auditWriter as never,
      activityEmitter as never,
      accessControlService as any,
    );

    await expect(useCase.execute("org-1", "actor", "target", "ADMIN")).rejects.toMatchObject({
      code: ERROR_CODES.ORGANIZATION_LAST_OWNER,
    });
  });

  it("allows demoting an owner when another owner remains", async () => {
    const repository = buildRepository({
      actorRole: "OWNER",
      targetRole: "OWNER",
      remainingOwners: 1,
    });
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new UpdateMemberRoleUseCase(
      transactionPort as any,
      repository as never,
      auditWriter as never,
      activityEmitter as never,
      accessControlService as any,
    );

    const result = await useCase.execute("org-1", "actor", "target", "ADMIN");

    expect(result.role).toBe("ADMIN");
  });

  it("rejects when the target is not a member", async () => {
    const repository = buildRepository();
    const auditWriter = { log: vi.fn() };
    const useCase = new UpdateMemberRoleUseCase(
      transactionPort as any,
      repository as never,
      auditWriter as never,
      activityEmitter as never,
      accessControlService as any,
    );

    await expect(useCase.execute("org-1", "actor", "stranger", "ADMIN")).rejects.toMatchObject({
      code: ERROR_CODES.ORGANIZATION_MEMBER_NOT_FOUND,
    });
  });
});
