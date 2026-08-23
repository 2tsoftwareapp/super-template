import { describe, expect, it } from "vitest";

import { generateRecoveryCodes, normalizeRecoveryCode } from "../recovery-codes";

describe("recovery-codes", () => {
  it("normalizes case and strips non-base32 chars", () => {
    expect(normalizeRecoveryCode("abcd-efgh")).toBe("ABCDEFGH");
    expect(normalizeRecoveryCode("ab cd-ef")).toBe("ABCDEF");
  });

  it("generates 8 codes by default", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    for (const c of codes) expect(c).toMatch(/^[A-Z2-7]{4}-[A-Z2-7]{4}$/);
  });

  it("generates requested count", () => {
    expect(generateRecoveryCodes(3)).toHaveLength(3);
  });

  it("generates unique codes", () => {
    const codes = generateRecoveryCodes(8);
    expect(new Set(codes).size).toBe(8);
  });
});
