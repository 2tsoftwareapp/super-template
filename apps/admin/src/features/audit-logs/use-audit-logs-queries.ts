"use client";

import { useQuery } from "@tanstack/react-query";

import { type AuditLogsParams, fetchAuditLogs } from "./api/audit-logs-api";
import { AUDIT_LOGS_QUERY_KEY } from "./model/audit-logs-query-keys";

export function useAuditLogsQuery(params: AuditLogsParams) {
  return useQuery({
    queryKey: [
      AUDIT_LOGS_QUERY_KEY,
      params.q,
      params.from,
      params.to,
      params.page,
    ],
    queryFn: () => fetchAuditLogs(params),
  });
}
