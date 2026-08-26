import { describe, expect, it } from "vitest";
import { ROLE_NAMES } from "@repo/api-runtime";

import { PERMISSION_SEED_ENTRIES, ROLE_SEED_ENTRIES } from "../access-control-seed.catalog";

describe("access-control-seed.catalog", () => {
  it("contains 3 system roles", () => {
    expect(ROLE_SEED_ENTRIES).toHaveLength(3);
    expect(ROLE_SEED_ENTRIES.map((r) => r.name)).toEqual([
      ROLE_NAMES.SUPER_ADMIN,
      ROLE_NAMES.ADMIN,
      ROLE_NAMES.USER,
    ]);
    for (const r of ROLE_SEED_ENTRIES) expect(r.isSystem).toBe(true);
  });

  it("generates permission seed entries with scope", () => {
    expect(PERMISSION_SEED_ENTRIES.length).toBeGreaterThan(0);
    for (const p of PERMISSION_SEED_ENTRIES) {
      expect(p.isSystem).toBe(true);
      expect(["platform", "organization"]).toContain(p.scope);
    }
  });
});
