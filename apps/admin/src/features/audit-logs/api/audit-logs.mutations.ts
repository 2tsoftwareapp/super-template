"use client";

import { useMutation } from "@tanstack/react-query";

import { downloadAuditLogExport, exportAuditLogs } from "./audit-logs.api";

export interface ExportAndDownloadAuditLogsInput {
  from: string | undefined;
  to: string | undefined;
  q: string | undefined;
}

export interface ExportAndDownloadAuditLogsResult {
  blob: Blob;
  truncated: boolean;
}

/**
 * Export audit logs then download the CSV blob.
 * Toast / navigation stay in the handler (§6 R3).
 */
export function useExportAndDownloadAuditLogsMutation() {
  return useMutation({
    mutationFn: async (
      input: ExportAndDownloadAuditLogsInput,
    ): Promise<ExportAndDownloadAuditLogsResult> => {
      const { data } = await exportAuditLogs(input);
      const blob = await downloadAuditLogExport(data.fileId);
      return { blob, truncated: data.truncated };
    },
  });
}
