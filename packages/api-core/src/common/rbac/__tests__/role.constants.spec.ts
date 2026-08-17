import { describe, expect, it } from "vitest";

import {
  FIXED_ROLE_NAMES,
  isFixedRoleName,
  isPrivilegedRoleName,
  ROLE_NAMES,
} from "../role.constants";

describe("role constants", () => {
  it("lists the three fixed role names", () => {
    expect(FIXED_ROLE_NAMES).toEqual(["SUPER_ADMIN", "ADMIN", "USER"]);
  });

  it("treats SUPER_ADMIN and ADMIN as privileged", () => {
    expect(isPrivilegedRoleName(ROLE_NAMES.SUPER_ADMIN)).toBe(true);
    expect(isPrivilegedRoleName(ROLE_NAMES.ADMIN)).toBe(true);
  });

  it("does not treat USER or unknown roles as privileged", () => {
    expect(isPrivilegedRoleName(ROLE_NAMES.USER)).toBe(false);
    expect(isPrivilegedRoleName("Project Manager")).toBe(false);
  });

  it("recognizes fixed role names only", () => {
    expect(isFixedRoleName("ADMIN")).toBe(true);
    expect(isFixedRoleName("Custom Role")).toBe(false);
  });
});
