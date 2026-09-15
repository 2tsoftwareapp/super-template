import type { EnvironmentService } from "@repo/api-runtime";

/**
 * Single source of truth for how Redis participates in health: whether it is
 * required, merely configured, or legitimately absent. The readiness
 * controller, the Redis health indicator, and the operational warnings all
 * call this policy, so "production must have REDIS_URL" cannot be decided
 * differently in two places (which would let /health/ready pass while the
 * warnings endpoint reports a misconfiguration).
 *
 * Pure function over the environment service: no framework, no I/O.
 */

/**
 * - `configured` — REDIS_URL is set: Redis must answer for readiness to pass.
 * - `required-missing` — production without REDIS_URL: a misconfiguration that
 *   readiness must surface (the Redis check runs and fails).
 * - `optional-absent` — non-production without REDIS_URL: single-instance
 *   in-process fallback is supported, so readiness skips the Redis check.
 */
export type RedisRequirement = "configured" | "required-missing" | "optional-absent";

export const MISSING_REDIS_URL_WARNING =
  "Production configuration requires REDIS_URL for shared throttling and the settings-flag cache (maintenance mode, registration enabled).";

export const REDIS_URL_NOT_CONFIGURED_REASON = "redis url not configured";

export function resolveRedisRequirement(
  environmentService: Pick<EnvironmentService, "isProduction" | "redisUrl">,
): RedisRequirement {
  if (environmentService.redisUrl) {
    return "configured";
  }

  return environmentService.isProduction ? "required-missing" : "optional-absent";
}

/** True when the Redis probe belongs in the readiness check list. */
export function shouldProbeRedis(requirement: RedisRequirement): boolean {
  return requirement !== "optional-absent";
}
