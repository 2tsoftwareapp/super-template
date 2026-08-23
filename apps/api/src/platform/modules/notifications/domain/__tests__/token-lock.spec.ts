import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { tokenLockId } from "../token-lock";

// The suite runs both from the package root (direct vitest) and from apps/api
// (turbo), so resolve the module dir from whichever cwd we are in.
function resolveModuleRoot(): string {
  // Suite runs from apps/api root (turbo/vitest) or from the module dir directly.
  const candidates = [
    join(process.cwd(), "src/platform/modules/notifications"),
    join(process.cwd(), "src/modules/notifications"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0]!;
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
  });
});
