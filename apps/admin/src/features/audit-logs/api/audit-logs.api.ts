import { bffPath } from "@repo/api-contract";

import type { AuditLogDto, ListResponse } from "@/lib/api-types";

import { buildPath, webFetch, webFetchBlob } from "@/lib/http";

export interface AuditLogsParams {
  page: number;
  from?: string;
  to?: string;
  q?: string;
  sortOrder?: "asc" | "desc";
}

export const auditLogsApi = {
  list(params: AuditLogsParams) {
    const path = buildPath(bffPath("/api/v1/admin/audit-logs"), {
      limit: 50,
      page: params.page,
      from: params.from,
      to: params.to,
      q: params.q,
      sortOrder: params.sortOrder,
    });
    return webFetch<ListResponse<AuditLogDto>>(path);
  },

  export(body: { from: string | undefined; to: string | undefined; q: string | undefined }) {
    return webFetch<{ data: ExportResponse }>(bffPath("/api/v1/admin/audit-logs/export"), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  downloadExport(fileId: string) {
    return webFetchBlob(
      bffPath("/api/v1/admin/audit-logs/exports/{fileId}/download", {
        fileId,
      }),
    );
  },
};

export interface ExportResponse {
  fileId: string;
  truncated: boolean;
}

/** @deprecated Prefer `auditLogsApi` */
export const fetchAuditLogs = (params: AuditLogsParams) => auditLogsApi.list(params);
export const exportAuditLogs = (body: Parameters<typeof auditLogsApi.export>[0]) =>
  auditLogsApi.export(body);
export const downloadAuditLogExport = (fileId: string) => auditLogsApi.downloadExport(fileId);
