import { describe, expect, it } from "vitest";
import { FileVersionConflictError } from "../errors";

describe("file errors", () => {
  it("creates conflict error with correct name and message", () => {
    const err = new FileVersionConflictError();
    expect(err.name).toBe("FileVersionConflictError");
    expect(err.message).toContain("concurrently");
    expect(err).toBeInstanceOf(Error);
  });
});