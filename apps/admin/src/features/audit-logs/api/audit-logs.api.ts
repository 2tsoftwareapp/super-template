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

export interface ExportResponse {
  fileId: string;
  truncated: boolean;
}

export async function exportAuditLogs(body: {
  from: string | undefined;
  to: string | undefined;
  q: string | undefined;
}) {
  return webFetch<{ data: ExportResponse }>("/api/bff/admin/audit-logs/export", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function downloadAuditLogExport(fileId: string) {
  const response = await fetch(
    `/api/bff/admin/audit-logs/exports/${fileId}/download`,
  );
  if (!response.ok) throw new Error("Download failed");
  return response.blob();
}
