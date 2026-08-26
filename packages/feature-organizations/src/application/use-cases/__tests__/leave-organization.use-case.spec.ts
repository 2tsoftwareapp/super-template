import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";

import { LeaveOrganizationUseCase } from "../leave-organization.use-case";

const transactionPort = {
  run: vi.fn().mockImplementation(async (fn: any) => fn(null)),
  withTenant: vi.fn().mockImplementation(async (tenant: any, fn: any) => fn(null)),
};

const accessControlService = {
  replaceUserRoles: vi.fn(async () => undefined),
  invalidateAccessProfile: vi.fn(async () => undefined),
};

describe("LeaveOrganizationUseCase", () => {
  it("blocks the last owner from leaving", async () => {
    const membership = {
      findMembership: vi.fn(async () => ({ userId: "u1", role: "OWNER" })),
      countOwners: vi.fn(async () => 0),
      removeMember: vi.fn(),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new LeaveOrganizationUseCase(
      transactionPort as any,
      membership as never,
      auditWriter as never,
      accessControlService as any,
    );

    await expect(useCase.execute("org-1", "u1")).rejects.toMatchObject({
      code: ERROR_CODES.ORGANIZATION_LAST_OWNER,
    });
    expect(membership.removeMember).not.toHaveBeenCalled();
  });

  it("allows an owner to leave when another owner remains", async () => {
    const membership = {
      findMembership: vi.fn(async () => ({ userId: "u1", role: "OWNER" })),
      countOwners: vi.fn(async () => 1),
      removeMember: vi.fn(async () => ({ userId: "u1" })),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new LeaveOrganizationUseCase(
      transactionPort as any,
      membership as never,
      auditWriter as never,
      accessControlService as any,
    );

    await useCase.execute("org-1", "u1");

    expect(membership.removeMember).toHaveBeenCalledWith("org-1", "u1", null);
    expect(auditWriter.log).toHaveBeenCalled();
  });

  it("allows a member to leave without an owner check", async () => {
    const membership = {
      findMembership: vi.fn(async () => ({ userId: "u2", role: "MEMBER" })),
      countOwners: vi.fn(),
      removeMember: vi.fn(async () => ({ userId: "u2" })),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new LeaveOrganizationUseCase(
      transactionPort as any,
      membership as never,
      auditWriter as never,
      accessControlService as any,
    );

    await useCase.execute("org-1", "u2");

    expect(membership.countOwners).not.toHaveBeenCalled();
    expect(membership.removeMember).toHaveBeenCalledWith("org-1", "u2", null);
  });

  it("rejects when the caller is not a member", async () => {
    const membership = {
      findMembership: vi.fn(async () => null),
      countOwners: vi.fn(),
      removeMember: vi.fn(),
    };
    const auditWriter = { log: vi.fn() };
    const useCase = new LeaveOrganizationUseCase(
      transactionPort as any,
      membership as never,
      auditWriter as never,
      accessControlService as any,
    );

    await expect(useCase.execute("org-1", "stranger")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });
  });
});
