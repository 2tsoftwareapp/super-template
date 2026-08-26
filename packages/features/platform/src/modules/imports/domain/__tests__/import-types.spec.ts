import { describe, expect, it } from "vitest";
import { isSupportedImportType, MAX_IMPORT_ROWS, SUPPORTED_IMPORT_TYPES } from "../import-types";

describe("import-types", () => {
  it("defines max import rows", () => {
    expect(MAX_IMPORT_ROWS).toBe(5000);
  });
  it("supports users type", () => {
    expect(SUPPORTED_IMPORT_TYPES).toContain("users");
    expect(isSupportedImportType("users")).toBe(true);
    expect(isSupportedImportType("unknown")).toBe(false);
  });
});
