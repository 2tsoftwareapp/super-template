import { describe, expect, it } from "vitest";
import {
  hashPassword,
  hashRefreshToken,
  verifyPassword,
  verifyPasswordWithTimingPadding,
  verifyRefreshTokenHash,
} from "./password";

describe("password utility", () => {
  describe("password hashing (argon2)", () => {
    it("hashes and verifies a password", async () => {
      const password = "secure-password-123";
      const hash = await hashPassword(password);

      expect(hash).toContain("$argon2id$");
      expect(await verifyPassword(hash, password)).toBe(true);
      expect(await verifyPassword(hash, "wrong-password")).toBe(false);
    });

    it("verifies with timing padding", async () => {
      const password = "secure-password-123";
      const hash = await hashPassword(password);

      expect(await verifyPasswordWithTimingPadding(hash, password)).toBe(true);
      expect(await verifyPasswordWithTimingPadding(hash, "wrong-password")).toBe(false);
      expect(await verifyPasswordWithTimingPadding(null, password)).toBe(false);
      expect(await verifyPasswordWithTimingPadding(undefined, password)).toBe(false);
    });
  });

  describe("refresh token hashing (sha256)", () => {
    it("hashes refresh token to a 64-character sha256 hex string", async () => {
      const token = "my-refresh-token-value";
      const hash = await hashRefreshToken(token);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      // SHA-256 of "my-refresh-token-value"
      // Verify deterministic SHA-256 output
      const secondHash = await hashRefreshToken(token);
      expect(hash).toBe(secondHash);
    });

    it("verifies valid and invalid refresh token hashes", async () => {
      const token = "session-refresh-token-xyz";
      const hash = await hashRefreshToken(token);

      expect(await verifyRefreshTokenHash(hash, token)).toBe(true);
      expect(await verifyRefreshTokenHash(hash, "wrong-token")).toBe(false);
      expect(await verifyRefreshTokenHash("invalid-hash", token)).toBe(false);
      expect(await verifyRefreshTokenHash("", token)).toBe(false);
      expect(await verifyRefreshTokenHash(hash, "")).toBe(false);
    });

    it("handles non-string arguments safely", async () => {
      // @ts-expect-error test invalid types
      expect(await verifyRefreshTokenHash(null, "token")).toBe(false);
      // @ts-expect-error test invalid types
      expect(await verifyRefreshTokenHash(undefined, "token")).toBe(false);
      // @ts-expect-error test invalid types
      expect(await verifyRefreshTokenHash("hash", null)).toBe(false);
    });
  });
});
