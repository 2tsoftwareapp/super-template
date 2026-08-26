import { describe, expect, it } from "vitest";
import { MAX_EXPORT_ROWS } from "../export-policy";

describe("export-policy", () => {
  it("defines max export rows bound", () => {
    expect(MAX_EXPORT_ROWS).toBe(50_000);
    expect(MAX_EXPORT_ROWS).toBeGreaterThan(0);
  });
});
