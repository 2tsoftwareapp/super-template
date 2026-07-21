import { jobsKeys } from "@/features/jobs/api/jobs.query-keys";

/**
 * Hierarchical dashboard keys. Jobs metrics reuses `jobsKeys.metrics` so the
 * dashboard and Jobs page share one cache entry.
 */
export const dashboardKeys = {
  all: ["admin-dashboard"] as const,
  users: ["admin-dashboard", "users"] as const,
  /** Shared with jobs feature — keep identical to `jobsKeys.metrics`. */
  jobs: jobsKeys.metrics,
  audit: ["admin-dashboard", "audit"] as const,
  health: ["admin-dashboard", "health"] as const,
  healthReady: ["admin-dashboard", "health-ready"] as const,
};
