import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EnvironmentService } from "../../config/environment";

import { AccessProfileCache, type AccessProfileSnapshot } from "../access-profile.cache";

const profile: AccessProfileSnapshot = {
  roles: ["ADMIN"],
  permissions: ["users.read"],
};

// Env stub with Redis disabled so the cache exercises its in-process fallback path.
// The cache reads the typed getters (not `.values`), so the stub must expose those.
function localOnlyEnv(ttlSeconds = 60): EnvironmentService {
  return {
    redisUrl: undefined,
    accessProfileCacheTtlSeconds: ttlSeconds,
  } as unknown as EnvironmentService;
}

// Deterministic, mutable clock installed before every test so the cache's
// Date.now() reads are fully under test control.
let clock = 1_000_000;

beforeEach(() => {
  clock = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => clock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AccessProfileCache (in-process fallback)", () => {
  it("stores and reads a profile", async () => {
    const cache = new AccessProfileCache(localOnlyEnv());
    await cache.set("user-1", profile);
    await expect(cache.get("user-1")).resolves.toEqual(profile);
  });

  it("returns null for an unknown user", async () => {
    const cache = new AccessProfileCache(localOnlyEnv());
    await expect(cache.get("missing")).resolves.toBeNull();
  });

  it("keeps an entry live within the TTL, then expires it once the TTL elapses", async () => {
    const cache = new AccessProfileCache(localOnlyEnv(1));
    await cache.set("user-1", profile); // expiresAt = clock + 1_000

    clock += 999; // still within the 1s TTL
    await expect(cache.get("user-1")).resolves.toEqual(profile);

    clock += 2; // now past the 1s TTL
    await expect(cache.get("user-1")).resolves.toBeNull();
  });

  it("invalidates a single user", async () => {
    const cache = new AccessProfileCache(localOnlyEnv());
    await cache.set("user-1", profile);
    await cache.invalidateUser("user-1");
    await expect(cache.get("user-1")).resolves.toBeNull();
  });

  it("invalidates multiple users at once", async () => {
    const cache = new AccessProfileCache(localOnlyEnv());
    await cache.set("user-1", profile);
    await cache.set("user-2", profile);

    await cache.invalidateUsers(["user-1", "user-2"]);

    await expect(cache.get("user-1")).resolves.toBeNull();
    await expect(cache.get("user-2")).resolves.toBeNull();
  });

  it("falls back to the default TTL when the configured value is non-positive", async () => {
    const cache = new AccessProfileCache(localOnlyEnv(0));
    await cache.set("user-1", profile); // 0 is invalid → default 60s applies

    clock += 59_000;
    await expect(cache.get("user-1")).resolves.toEqual(profile);

    clock += 2_000; // now 61s in, past the 60s default
    await expect(cache.get("user-1")).resolves.toBeNull();
  });
});
