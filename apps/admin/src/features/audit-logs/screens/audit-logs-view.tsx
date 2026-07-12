"use client";

import { useAuditLogsController } from "@/features/audit-logs/controllers/use-audit-logs-controller";

import { AuditLogsListView } from "../ui/audit-logs-list-view";

/**
 * Audit-logs screen: connects the audit-logs controller to the presentational
 * view.
 */
export function AuditLogsView() {
  const controller = useAuditLogsController();

  return <AuditLogsListView {...controller} />;
}
