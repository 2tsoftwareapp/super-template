import { describe, expect, it } from "vitest";

import { base32Decode, base32Encode, generateTotpCode, verifyTotpCode } from "../totp";

describe("totp", () => {
  // RFC 6238 / RFC 4226 test vectors using the 20-byte ASCII secret "12345678901234567890".
  const secret = Buffer.from("12345678901234567890", "ascii");

  it("matches RFC 6238 test vectors", () => {
    expect(generateTotpCode(secret, new Date(59 * 1000))).toBe("287082");
    expect(generateTotpCode(secret, new Date(1111111109 * 1000))).toBe("081804");
    expect(generateTotpCode(secret, new Date(1111111111 * 1000))).toBe("050471");
  });

  it("verifies a code generated for the current time", () => {
    const now = new Date();
    const code = generateTotpCode(secret, now);
    expect(verifyTotpCode(secret, code, now)).toBe(true);
  });

  it("tolerates one step of clock drift", () => {
    const now = new Date();
    const previousStepCode = generateTotpCode(secret, new Date(now.getTime() - 30_000));
    expect(verifyTotpCode(secret, previousStepCode, now)).toBe(true);
  });

  it("rejects a code two steps out of window", () => {
    const now = new Date();
    const staleCode = generateTotpCode(secret, new Date(now.getTime() - 90_000));
    expect(verifyTotpCode(secret, staleCode, now)).toBe(false);
  });

  it("rejects malformed codes", () => {
    expect(verifyTotpCode(secret, "abcdef")).toBe(false);
    expect(verifyTotpCode(secret, "123")).toBe(false);
  });

  it("round-trips base32 encoding", () => {
    const encoded = base32Encode(secret);
    expect(base32Decode(encoded)).toEqual(secret);
  });
});
