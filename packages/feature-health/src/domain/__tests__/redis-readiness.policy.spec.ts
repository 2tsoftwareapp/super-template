import { describe, expect, it } from "vitest";

import {
  MISSING_REDIS_URL_WARNING,
  resolveRedisRequirement,
  shouldProbeRedis,
} from "../redis-readiness.policy";

const env = (overrides: { isProduction?: boolean; redisUrl?: string | undefined }) => ({
  isProduction: overrides.isProduction ?? false,
  redisUrl: overrides.redisUrl,
});

describe("resolveRedisRequirement", () => {
  it("is configured whenever REDIS_URL is set", () => {
    expect(resolveRedisRequirement(env({ redisUrl: "redis://localhost:6379" }))).toBe("configured");
    expect(
      resolveRedisRequirement(env({ isProduction: true, redisUrl: "rediss://prod:6379" })),
    ).toBe("configured");
  });

  it("is required-missing in production without REDIS_URL", () => {
    expect(resolveRedisRequirement(env({ isProduction: true, redisUrl: undefined }))).toBe(
      "required-missing",
    );
  });

  it("is optional-absent outside production without REDIS_URL", () => {
    expect(resolveRedisRequirement(env({ isProduction: false, redisUrl: undefined }))).toBe(
      "optional-absent",
    );
  });

  it("does not treat the dev in-process fallback as configured", () => {
    // No URL, no production: single-instance fallback is supported, so this is
    // not a misconfiguration and must not raise the production warning.
    const requirement = resolveRedisRequirement(env({ isProduction: false }));
    expect(requirement).not.toBe("required-missing");
    expect(MISSING_REDIS_URL_WARNING).toContain("REDIS_URL");
  });
});

describe("shouldProbeRedis", () => {
  it("probes when Redis is configured", () => {
    expect(shouldProbeRedis("configured")).toBe(true);
  });

  it("probes in a misconfigured production so readiness fails loudly", () => {
    expect(shouldProbeRedis("required-missing")).toBe(true);
  });

  it("skips the probe when Redis is legitimately absent", () => {
    expect(shouldProbeRedis("optional-absent")).toBe(false);
  });
});
