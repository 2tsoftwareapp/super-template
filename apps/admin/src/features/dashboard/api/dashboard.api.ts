import type { AuditLogDto, JobDto, ListResponse, UserRow } from "@/lib/api-types";

import { webFetch } from "@/lib/http";

export async function fetchOverviewUsers() {
  return webFetch<ListResponse<UserRow>>("/api/bff/admin/users?limit=4");
}

export async function fetchJobsSummary() {
  return webFetch<ListResponse<JobDto>>("/api/bff/admin/jobs?limit=100");
}

export async function fetchAuditSummary() {
  return webFetch<ListResponse<AuditLogDto>>("/api/bff/admin/audit-logs?limit=5");
}

export async function fetchHealthStatus() {
  return webFetch<{ data: { status: string } }>("/api/bff/health");
}
