import { describe, expect, it } from "vitest";

import { hashRecoveryCode } from "../hash-recovery-code";
import { normalizeRecoveryCode } from "../recovery-codes";

describe("hash-recovery-code", () => {
  it("hashes case and dash insensitively", () => {
    const a = hashRecoveryCode("abcd-efgh");
    const b = hashRecoveryCode("ABCD-EFGH");
    const c = hashRecoveryCode("abcd efgh");
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  it("normalizes before hashing", () => {
    expect(hashRecoveryCode("ab12")).toBe(hashRecoveryCode(normalizeRecoveryCode("ab12")));
  });

  it("produces different hash for different codes", () => {
    expect(hashRecoveryCode("AAAA-BBBB")).not.toBe(hashRecoveryCode("CCCC-DDDD"));
  });
});
