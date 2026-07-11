"use client";

import { useQuery } from "@tanstack/react-query";

import { type AuditLogsParams, fetchAuditLogs } from "./audit-logs-service";

export const AUDIT_LOGS_QUERY_KEY = "admin-audit-logs" as const;

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
