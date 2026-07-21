import type {
  AuditLogDto,
  JobMetricsDto,
  ListResponse,
  UserRow,
} from "@/lib/api-types";

import { webFetch } from "@/lib/http";

/**
 * Dashboard transport layer. The only place in the feature that talks HTTP;
 * query hooks call these functions instead of webFetch directly.
 */
export const dashboardApi = {
  overviewUsers() {
    return webFetch<ListResponse<UserRow>>("/api/bff/admin/users?limit=4");
  },

  jobMetrics() {
    return webFetch<{ data: JobMetricsDto }>("/api/bff/admin/jobs/metrics");
  },

  auditSummary() {
    return webFetch<ListResponse<AuditLogDto>>(
      "/api/bff/admin/audit-logs?limit=5",
    );
  },

  /** App liveness — does not include the database. */
  health() {
    return webFetch<{ data: { status: string } }>("/api/bff/health");
  },

  /** Readiness — app + database. */
  healthReady() {
    return webFetch<{ data: { status: string } }>("/api/bff/health/ready");
  },
};
