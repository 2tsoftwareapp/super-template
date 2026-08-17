import { describe, expect, it } from "vitest";

import { isPostgresUniqueViolation } from "../postgres-errors";

describe("isPostgresUniqueViolation", () => {
  it("detects a direct unique-violation code", () => {
    expect(isPostgresUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("detects a unique-violation code nested under cause", () => {
    expect(isPostgresUniqueViolation({ cause: { code: "23505" } })).toBe(true);
  });

  it("returns false for other postgres error codes", () => {
    expect(isPostgresUniqueViolation({ code: "23503" })).toBe(false);
  });

  it.each([null, undefined, "boom", 42, {}])("returns false for non-matching value %s", (value) => {
    expect(isPostgresUniqueViolation(value)).toBe(false);
  });
});
