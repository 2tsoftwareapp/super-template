import { describe, expect, it } from "vitest";

import { selectFilePermissions } from "../files.permissions";

describe("files.permissions", () => {
  it("maps files.create / files.delete", () => {
    expect(selectFilePermissions(["files.create", "files.delete"])).toEqual({
      canCreate: true,
      canDelete: true,
    });
    expect(selectFilePermissions(["files.create"])).toEqual({
      canCreate: true,
      canDelete: false,
    });
  });

  it("returns false for empty permissions", () => {
    expect(selectFilePermissions(undefined)).toEqual({ canCreate: false, canDelete: false });
  });
});
