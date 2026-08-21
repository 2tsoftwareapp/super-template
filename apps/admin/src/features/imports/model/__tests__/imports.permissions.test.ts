import { describe, expect, it } from "vitest";

import { selectImportPermissions } from "../imports.permissions";

describe("imports.permissions", () => {
  it("maps imports.create / imports.update", () => {
    expect(selectImportPermissions(["imports.create", "imports.update"])).toEqual({
      canCreate: true,
      canUpdate: true,
    });
  });

  it("returns false for empty permissions", () => {
    expect(selectImportPermissions(undefined)).toEqual({ canCreate: false, canUpdate: false });
  });
});
