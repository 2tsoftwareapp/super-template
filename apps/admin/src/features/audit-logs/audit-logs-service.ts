import type { AuditLogDto, ListResponse } from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export interface AuditLogsParams {
  page: number;
  from?: string;
  to?: string;
  q?: string;
}

export async function fetchAuditLogs(params: AuditLogsParams) {
  const path = buildPath("/api/bff/admin/audit-logs", {
    limit: 50,
    page: params.page,
    from: params.from,
    to: params.to,
    q: params.q,
  });
  return webFetch<ListResponse<AuditLogDto>>(path);
}
