import type { OrganizationMembership } from "@repo/feature-organizations/contracts";

import { describe, expect, it, vi } from "vitest";

import { LastOwnerGuard } from "../last-owner-guard.service";

function buildMembership(countOwners: number) {
  return {
    countOwners: vi.fn(async () => countOwners),
  } as unknown as OrganizationMembership;
}

describe("LastOwnerGuard", () => {
  it("locks and counts owners before applying an OWNER removal", async () => {
    const membership = buildMembership(1);
    const guard = new LastOwnerGuard(membership);
    const applyChange = vi.fn(async () => "removed");

    await expect(
      guard.run("org-1", { userId: "u1", currentRole: "OWNER" }, "tx" as never, applyChange),
    ).resolves.toBe("removed");

    expect(membership.countOwners).toHaveBeenCalledWith("org-1", {
      excludingUserId: "u1",
      executor: "tx",
      lock: true,
    });
    expect(applyChange).toHaveBeenCalledTimes(1);
  });

  it("rejects removing the last owner without applying the change", async () => {
    const membership = buildMembership(0);
    const guard = new LastOwnerGuard(membership);
    const applyChange = vi.fn(async () => "removed");

    await expect(
      guard.run("org-1", { userId: "u1", currentRole: "OWNER" }, "tx" as never, applyChange),
    ).rejects.toThrow(expect.objectContaining({ code: "ORGANIZATION_LAST_OWNER" }));

    expect(applyChange).not.toHaveBeenCalled();
  });

  it("skips the owner count for non-owner members", async () => {
    const membership = buildMembership(3);
    const guard = new LastOwnerGuard(membership);
    const applyChange = vi.fn(async () => "removed");

    await expect(
      guard.run("org-1", { userId: "u1", currentRole: "ADMIN" }, "tx" as never, applyChange),
    ).resolves.toBe("removed");

    expect(membership.countOwners).not.toHaveBeenCalled();
    expect(applyChange).toHaveBeenCalledTimes(1);
  });

  it("skips the owner count when the member keeps ownership", async () => {
    const membership = buildMembership(0);
    const guard = new LastOwnerGuard(membership);
    const applyChange = vi.fn(async () => "updated");

    await expect(
      guard.run(
        "org-1",
        { userId: "u1", currentRole: "OWNER", keepsOwnership: true },
        "tx" as never,
        applyChange,
      ),
    ).resolves.toBe("updated");

    expect(membership.countOwners).not.toHaveBeenCalled();
    expect(applyChange).toHaveBeenCalledTimes(1);
  });
});
