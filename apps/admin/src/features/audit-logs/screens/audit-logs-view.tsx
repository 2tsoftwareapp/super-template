"use client";

import { useAuditLogsController } from "@/features/audit-logs/controllers/use-audit-logs-controller";

import { AuditLogsListView } from "../ui/audit-logs-list-view";
import { createAuditLogsColumns } from "../ui/audit-logs-table-columns";

/**
 * Audit-logs screen: connects the audit-logs controller to the presentational
 * view.
 */
export function AuditLogsView() {
  const controller = useAuditLogsController({ createColumns: createAuditLogsColumns });

  return <AuditLogsListView {...controller} />;
}
