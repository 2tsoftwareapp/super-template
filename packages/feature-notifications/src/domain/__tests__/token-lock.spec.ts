import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { tokenLockId, normalizeDeviceToken } from "../token-lock";

// Resolve the module dir relative to this test file so the suite works no
// matter which cwd runs it (package root directly, or apps/api via turbo).
// __dirname === <module>/domain/__tests__, so two levels up is the module root.
function resolveModuleRoot(): string {
  const fromHere = join(__dirname, "..", "..");
  if (existsSync(fromHere)) {
    return fromHere;
  }
  return join(process.cwd(), "src/platform/modules/notifications");
}

const moduleRoot = resolveModuleRoot();

describe("tokenLockId", () => {
  it("matches the golden FNV-1a values", () => {
    expect(tokenLockId("")).toBe(18652613);
    expect(tokenLockId("token-a")).toBe(1288804548);
    expect(tokenLockId("APA91bExampleFCMToken1234567890abcdef")).toBe(520743880);
  });

  it("is deterministic and always a positive 32-bit integer", () => {
    const samples = [
      "a",
      "APA91bExampleFCMToken1234567890abcdef",
      "token-with-a-very-long-name-that-goes-on-and-on",
      "xyz",
    ];

    for (const sample of samples) {
      const id = tokenLockId(sample);
      expect(id).toBe(tokenLockId(sample));
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThanOrEqual(0x7fffffff);
    }
  });

  it("distinguishes distinct tokens", () => {
    expect(tokenLockId("token-a")).not.toBe(tokenLockId("token-b"));
  });

  it("is shared by the delivery processor and device-token repository", () => {
    const processor = readFileSync(
      join(moduleRoot, "application/services/notification-delivery.processor.ts"),
      "utf8",
    );
    const repository = readFileSync(
      join(moduleRoot, "infrastructure/device-tokens.repository.ts"),
      "utf8",
    );

    // Both critical sections must serialize on the exact same hash — importing
    // the shared helper is what keeps them in sync (regression guard against
    // someone re-inlining a copy of the function).
    expect(processor).toMatch(/from ['"].*domain\/token-lock['"]/);
    expect(repository).toMatch(/from ['"].*domain\/token-lock['"]/);
    expect(processor).not.toContain("function tokenLockId");
    expect(repository).not.toContain("function tokenLockId");
    expect(processor).not.toContain("function normalizeDeviceToken");
    expect(repository).not.toContain("function normalizeDeviceToken");
  });

  describe("producer/consumer convergence (token-lock invariant)", () => {
    it("producer (registerOrTransfer) and consumer (delivery processor) derive the same lock id for the same token", () => {
      // Producer side: the raw token payload of a register/transfer request,
      // which registerOrTransfer persists verbatim and locks on.
      const registerInput = { token: "APA91bExampleFCMToken1234567890abcdef" };
      // Consumer side: the value the delivery processor reads back from the
      // device-token row the producer wrote and locks on before sending FCM.
      const claimedDeliveryToken = registerInput.token;

      const producerLockId = tokenLockId(registerInput.token);
      const consumerLockId = tokenLockId(claimedDeliveryToken);

      expect(producerLockId).toBe(consumerLockId);
      expect(producerLockId).toBe(520743880); // golden FNV-1a value
    });

    it("hashes the canonical form so formatting differences cannot fork the lock", () => {
      expect(normalizeDeviceToken("  token-a \n")).toBe("token-a");
      expect(tokenLockId("  token-a \n")).toBe(tokenLockId("token-a"));
      expect(tokenLockId(" token-a ")).toBe(1288804548); // same golden value as the canonical form
    });

    it("yields different lock ids for different tokens", () => {
      expect(tokenLockId("token-a")).not.toBe(tokenLockId("token-b"));
      expect(tokenLockId(normalizeDeviceToken("token-a"))).not.toBe(
        tokenLockId(normalizeDeviceToken("token-b")),
      );
    });
  });
});
