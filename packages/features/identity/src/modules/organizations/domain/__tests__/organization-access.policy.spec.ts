import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "@repo/api-core";

import {
  assertCanManageTargetRole,
  assertNotLastOwner,
  assertOrganizationRole,
} from "../organization-access.policy";

describe("assertOrganizationRole", () => {
  it("allows a role in the allow-list", () => {
    expect(() =>
      assertOrganizationRole({ userId: "u1", role: "ADMIN" }, ["OWNER", "ADMIN"]),
    ).not.toThrow();
  });

  it("rejects a role outside the allow-list", async () => {
    expect(() =>
      assertOrganizationRole({ userId: "u1", role: "MEMBER" }, ["OWNER", "ADMIN"]),
    ).toThrowError(expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN }));
  });
});

describe("assertCanManageTargetRole", () => {
  it("lets an owner manage any target role", () => {
    expect(() => assertCanManageTargetRole("OWNER", "OWNER")).not.toThrow();
    expect(() => assertCanManageTargetRole("OWNER", "ADMIN")).not.toThrow();
    expect(() => assertCanManageTargetRole("OWNER", "MEMBER")).not.toThrow();
  });

  it("lets an admin manage members only", () => {
    expect(() => assertCanManageTargetRole("ADMIN", "MEMBER")).not.toThrow();
  });

  it("blocks an admin from managing another admin or an owner", () => {
    expect(() => assertCanManageTargetRole("ADMIN", "ADMIN")).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN }),
    );
    expect(() => assertCanManageTargetRole("ADMIN", "OWNER")).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN }),
    );
  });
});

describe("assertNotLastOwner", () => {
  it("allows removing an owner when another owner remains", () => {
    expect(() => assertNotLastOwner({ userId: "u1", role: "OWNER" }, 1)).not.toThrow();
  });

  it("blocks removing the last owner", () => {
    expect(() => assertNotLastOwner({ userId: "u1", role: "OWNER" }, 0)).toThrowError(
      expect.objectContaining({ code: ERROR_CODES.ORGANIZATION_LAST_OWNER }),
    );
  });

  it("does not block non-owners regardless of remaining owner count", () => {
    expect(() => assertNotLastOwner({ userId: "u1", role: "MEMBER" }, 0)).not.toThrow();
  });
});
