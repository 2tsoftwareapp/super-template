import { bffPath } from "@repo/api-contract";

import type { AuditLogDto, JobMetricsDto, ListResponse, UserRow } from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

/**
 * Dashboard transport layer. Paths from OpenAPI via `bffPath` (§22).
 */
export const dashboardApi = {
  overviewUsers() {
    return webFetch<ListResponse<UserRow>>(buildPath(bffPath("/api/v1/admin/users"), { limit: 4 }));
  },

  jobMetrics() {
    return webFetch<{ data: JobMetricsDto }>(bffPath("/api/v1/admin/jobs/metrics"));
  },

  auditSummary() {
    return webFetch<ListResponse<AuditLogDto>>(
      buildPath(bffPath("/api/v1/admin/audit-logs"), { limit: 5 }),
    );
  },

  /** App liveness — does not include the database. */
  health() {
    return webFetch<{ data: { status: string } }>(bffPath("/api/v1/health"));
  },

  /** Readiness — app + database. */
  healthReady() {
    return webFetch<{ data: { status: string } }>(bffPath("/api/v1/health/ready"));
  },
};
