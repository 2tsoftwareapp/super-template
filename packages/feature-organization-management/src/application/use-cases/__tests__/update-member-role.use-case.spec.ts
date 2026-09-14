import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import { LastOwnerGuard } from "../../services/last-owner-guard.service";
import { UpdateMemberRoleUseCase } from "../update-member-role.use-case";

function buildMocks() {
  const membership = {
    findMembership: vi.fn(),
    countOwners: vi.fn(),
    updateMemberRole: vi.fn(),
  };
  const accessControl = {
    replaceUserRoles: vi.fn(async () => undefined),
    invalidateAccessProfile: vi.fn(async () => undefined),
    ensureOrganizationAdminRole: vi.fn(async () => undefined),
  };
  const auditWriter = {
    log: vi.fn(async () => undefined),
  };
  const activityEmitter = {
    emit: vi.fn(async () => undefined),
  };
  const transactionPort = {
    withTenant: vi.fn(async (_ctx: unknown, fn: (tx: unknown) => Promise<unknown>) => fn("tx")),
  };
  return { membership, accessControl, auditWriter, activityEmitter, transactionPort };
}

function buildUseCase(mocks: ReturnType<typeof buildMocks>) {
  return new UpdateMemberRoleUseCase(
    mocks.transactionPort as never,
    mocks.membership as never,
    mocks.auditWriter as never,
    mocks.activityEmitter as never,
    mocks.accessControl as never,
    // Real guard over the mocked membership port.
    new LastOwnerGuard(mocks.membership as never),
  );
}

describe("UpdateMemberRoleUseCase", () => {
  it("allows OWNER to promote MEMBER to ADMIN", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockImplementation(async (_orgId: string, userId: string) => {
      if (userId === "actor") return { userId: "actor", role: "OWNER" };
      return { userId, role: "MEMBER" };
    });
    m.membership.updateMemberRole.mockResolvedValue({
      userId: "target",
      role: "ADMIN",
      updatedAt: new Date(),
    });

    const useCase = buildUseCase(m);
    await useCase.execute("org-1", { userId: "actor", roles: ["USER"] }, "target", "ADMIN");

    expect(m.accessControl.ensureOrganizationAdminRole).toHaveBeenCalledWith(
      "org-1",
      "target",
      "tx",
    );
    expect(m.auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "organization.member.role-update" }),
      "tx",
    );
  });

  it("prevents ADMIN from promoting anyone to ADMIN (only OWNER can)", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockImplementation(async (_orgId: string, userId: string) => {
      if (userId === "actor") return { userId: "actor", role: "ADMIN" };
      return { userId, role: "MEMBER" };
    });

    const useCase = buildUseCase(m);
    await expect(
      useCase.execute("org-1", { userId: "actor", roles: ["USER"] }, "target", "ADMIN"),
    ).rejects.toThrow(/owner/i);
    expect(m.membership.updateMemberRole).not.toHaveBeenCalled();
  });

  it("prevents ADMIN from promoting to OWNER", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockImplementation(async (_orgId: string, userId: string) => {
      if (userId === "actor") return { userId: "actor", role: "ADMIN" };
      return { userId, role: "MEMBER" };
    });

    const useCase = buildUseCase(m);
    await expect(
      useCase.execute("org-1", { userId: "actor", roles: ["USER"] }, "target", "OWNER"),
    ).rejects.toThrow(/owner/i);
    expect(m.membership.updateMemberRole).not.toHaveBeenCalled();
  });

  it("prevents MEMBER from changing any role", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockImplementation(async (_orgId: string, userId: string) => {
      if (userId === "actor") return { userId: "actor", role: "MEMBER" };
      return { userId, role: "MEMBER" };
    });

    const useCase = buildUseCase(m);
    await expect(
      useCase.execute("org-1", { userId: "actor", roles: ["USER"] }, "target", "ADMIN"),
    ).rejects.toThrow(/role/i);
  });

  it("allows SUPER_ADMIN to bypass membership check", async () => {
    const m = buildMocks();
    // SUPER_ADMIN skips actor membership check, only target check
    m.membership.findMembership.mockResolvedValue({ userId: "target", role: "MEMBER" });
    m.membership.updateMemberRole.mockResolvedValue({
      userId: "target",
      role: "ADMIN",
      updatedAt: new Date(),
    });

    const useCase = buildUseCase(m);
    await useCase.execute(
      "org-1",
      { userId: "admin", roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN] },
      "target",
      "ADMIN",
    );

    expect(m.membership.updateMemberRole).toHaveBeenCalled();
  });

  it("prevents demoting the last OWNER", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockImplementation(async (_orgId: string, userId: string) => {
      return { userId, role: "OWNER" };
    });
    m.membership.countOwners.mockResolvedValue(0);

    const useCase = buildUseCase(m);
    await expect(
      useCase.execute("org-1", { userId: "actor", roles: ["USER"] }, "target", "MEMBER"),
    ).rejects.toThrow(expect.objectContaining({ code: "ORGANIZATION_LAST_OWNER" }));

    // The guard locks the owner rows before it decides.
    expect(m.membership.countOwners).toHaveBeenCalledWith("org-1", {
      excludingUserId: "target",
      executor: "tx",
      lock: true,
    });
    expect(m.membership.updateMemberRole).not.toHaveBeenCalled();
  });

  it("re-applying OWNER to an OWNER keeps ownership and skips the last-owner guard", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockImplementation(async (_orgId: string, userId: string) => {
      return { userId, role: "OWNER" };
    });
    m.membership.countOwners.mockResolvedValue(0);
    m.membership.updateMemberRole.mockResolvedValue({
      userId: "target",
      role: "OWNER",
      updatedAt: new Date(),
    });

    const useCase = buildUseCase(m);
    await useCase.execute("org-1", { userId: "actor", roles: ["USER"] }, "target", "OWNER");

    expect(m.membership.countOwners).not.toHaveBeenCalled();
    expect(m.membership.updateMemberRole).toHaveBeenCalledWith("org-1", "target", "OWNER", "tx");
  });

  it("clears RBAC roles when demoting to MEMBER", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockImplementation(async (_orgId: string, userId: string) => {
      if (userId === "actor") return { userId: "actor", role: "OWNER" };
      return { userId, role: "ADMIN" };
    });
    m.membership.updateMemberRole.mockResolvedValue({
      userId: "target",
      role: "MEMBER",
      updatedAt: new Date(),
    });

    const useCase = buildUseCase(m);
    await useCase.execute("org-1", { userId: "actor", roles: ["USER"] }, "target", "MEMBER");

    expect(m.accessControl.replaceUserRoles).toHaveBeenCalledWith("target", [], "org-1", "tx");
    expect(m.accessControl.invalidateAccessProfile).toHaveBeenCalledWith("target");
  });

  it("throws when target is not a member", async () => {
    const m = buildMocks();
    // Actor is OWNER but target is null
    m.membership.findMembership.mockImplementation(async (_orgId: string, userId: string) => {
      if (userId === "actor") return { userId: "actor", role: "OWNER" };
      return null;
    });

    const useCase = buildUseCase(m);
    await expect(
      useCase.execute("org-1", { userId: "actor", roles: ["USER"] }, "target", "ADMIN"),
    ).rejects.toThrow(expect.objectContaining({ code: "ORGANIZATION_MEMBER_NOT_FOUND" }));
  });
});
