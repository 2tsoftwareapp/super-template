"use client";

import { useQuery } from "@tanstack/react-query";

import { type AuditLogsParams, fetchAuditLogs } from "./api/audit-logs-api";
import { auditLogsKeys } from "./model/audit-logs-query-keys";

export function useAuditLogsQuery(params: AuditLogsParams) {
  return useQuery({
    queryKey: auditLogsKeys.list({
      q: params.q,
      from: params.from,
      to: params.to,
      page: params.page,
    }),
    queryFn: () => fetchAuditLogs(params),
  });
}
