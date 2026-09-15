import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { LastOwnerGuard } from "../../services/last-owner-guard.service";
import { LeaveOrganizationUseCase } from "../leave-organization.use-case";

/** Whole actor, not a fragment: `execute` takes `string | AuthenticatedRequestUser`,
 *  and only the real shape is assignable to the latter. */
const actorFor = (userId: string, roles: string[] = []): AuthenticatedRequestUser => ({
  userId,
  sessionId: `session-${userId}`,
  email: `${userId}@example.local`,
  displayName: userId,
  status: "ACTIVE",
  roles,
  permissions: [],
  organizationId: "org-1",
});

function buildMocks() {
  const membership = {
    findMembership: vi.fn(),
    countOwners: vi.fn(),
    removeMember: vi.fn(),
  };
  const accessControl = {
    replaceUserRoles: vi.fn(async () => undefined),
    invalidateAccessProfile: vi.fn(async () => undefined),
    ensureOrganizationAdminRole: vi.fn(async () => undefined),
  };
  const auditWriter = {
    log: vi.fn(async () => undefined),
  };
  const transactionPort = {
    withTenant: vi.fn(async (_ctx: unknown, fn: (tx: unknown) => Promise<unknown>) => fn("tx")),
  };
  return { membership, accessControl, auditWriter, transactionPort };
}

function buildUseCase(mocks: ReturnType<typeof buildMocks>) {
  return new LeaveOrganizationUseCase(
    mocks.transactionPort as never,
    mocks.membership as never,
    mocks.auditWriter as never,
    mocks.accessControl as never,
    // Real guard over the mocked membership port: these tests exercise the
    // leave flow end to end through the shared last-owner sequence.
    new LastOwnerGuard(mocks.membership as never),
  );
}

describe("LeaveOrganizationUseCase", () => {
  it("removes member and cleans up RBAC roles when leaving as ADMIN", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockResolvedValue({
      userId: "u1",
      role: "ADMIN",
    });
    m.membership.removeMember.mockResolvedValue(true);

    const useCase = buildUseCase(m);
    await useCase.execute("org-1", "u1");

    expect(m.membership.removeMember).toHaveBeenCalledWith("org-1", "u1", "tx");
    expect(m.accessControl.replaceUserRoles).toHaveBeenCalledWith("u1", [], "org-1", "tx");
    expect(m.accessControl.invalidateAccessProfile).toHaveBeenCalledWith("u1");
    expect(m.auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "organization.leave" }),
      "tx",
    );
  });

  it("allows OWNER to leave when other owners remain", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockResolvedValue({
      userId: "u1",
      role: "OWNER",
    });
    m.membership.countOwners.mockResolvedValue(1); // 1 other owner
    m.membership.removeMember.mockResolvedValue(true);

    const useCase = buildUseCase(m);
    await useCase.execute("org-1", "u1");

    expect(m.membership.removeMember).toHaveBeenCalled();
  });

  it("rejects OWNER leaving as the last owner", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockResolvedValue({
      userId: "u1",
      role: "OWNER",
    });
    m.membership.countOwners.mockResolvedValue(0); // no other owners

    const useCase = buildUseCase(m);
    await expect(useCase.execute("org-1", "u1")).rejects.toThrow(
      expect.objectContaining({ code: "ORGANIZATION_LAST_OWNER" }),
    );
    expect(m.membership.removeMember).not.toHaveBeenCalled();
  });

  it("throws when user is not a member", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockResolvedValue(null);

    const useCase = buildUseCase(m);
    await expect(useCase.execute("org-1", "u1")).rejects.toThrow(
      expect.objectContaining({ code: "AUTH_FORBIDDEN" }),
    );
  });

  it("passes string actor (userId) directly", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockResolvedValue({
      userId: "u2",
      role: "MEMBER",
    });
    m.membership.removeMember.mockResolvedValue(true);

    const useCase = buildUseCase(m);
    await useCase.execute("org-1", "u2");

    expect(m.membership.findMembership).toHaveBeenCalledWith("org-1", "u2", "tx");
  });

  it("passes AuthenticatedRequestUser actor extracting userId", async () => {
    const m = buildMocks();
    m.membership.findMembership.mockResolvedValue({
      userId: "u3",
      role: "MEMBER",
    });
    m.membership.removeMember.mockResolvedValue(true);

    const useCase = buildUseCase(m);
    await useCase.execute("org-1", actorFor("u3", ["USER"]));

    expect(m.membership.findMembership).toHaveBeenCalledWith("org-1", "u3", "tx");
  });
});
