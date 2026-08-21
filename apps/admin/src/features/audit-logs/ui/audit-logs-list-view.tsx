"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent } from "@repo/web-ui/card";
import { DatePicker } from "@repo/web-ui/date-picker";
import { Pagination } from "@repo/web-ui/pagination";
import { Spinner } from "@repo/web-ui/spinner";
import { Download } from "lucide-react";

import type { AuditLogsViewModel } from "@/features/audit-logs/model/audit-logs.types";
import type { AuditLogDto } from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceTable } from "@/components/resource-table";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { adminResources } from "@/lib/admin-resources";

import { AuditLogsEventDetail } from "./audit-logs-event-detail";

const auditLogsResource = adminResources.find((r) => r.id === "audit-logs")!;

/**
 * Presentational audit-logs view. Receives a fully-resolved view model from the
 * audit-logs controller and renders it; it owns no server state, URL state, or
 * orchestration.
 */
export function AuditLogsListView({
  filters,
  hasFilters,
  onFilterChange,
  onClearFilters,
  isLoading,
  isRefreshing,
  hasError,
  onRefresh,
  total,
  totalPages,
  selectedEntry,
  onSelectEntry,
  onExport,
  isExporting,
  formatAction,
  table,
}: AuditLogsViewModel) {
  return (
    <ResourcePageShell
      resource={auditLogsResource}
      description="Who changed what, and when."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <ResourceToolbar
          search={filters.q}
          onSearchChange={(value) => onFilterChange("q", value)}
          searchPlaceholder="Search events…"
          hasFilters={hasFilters}
          onClearFilters={onClearFilters}
          {...(total > 0 ? { resultLabel: `${total} event${total !== 1 ? "s" : ""}` } : {})}
          filters={
            <>
              <DatePicker
                value={filters.from}
                onChange={(v) => onFilterChange("from", v)}
                placeholder="From"
              />
              <DatePicker
                value={filters.to}
                onChange={(v) => onFilterChange("to", v)}
                placeholder="To"
              />
            </>
          }
          actions={
            <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
              {isExporting ? <Spinner className="size-3.5" /> : <Download className="size-3.5" />}
              Export
            </Button>
          }
        />

        <CardContent className="p-0 pb-1">
          <ResourceTable
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- model table is any
            table={table}
            isLoading={isLoading}
            {...(hasError ? { error: { title: "Could not load audit logs." } } : {})}
            onRetry={onRefresh}
            onRowClick={(row) => onSelectEntry(row.original as AuditLogDto)}
            emptyTitle={hasFilters ? "No events match your filters." : "No events recorded yet."}
          />
          <Pagination
            page={filters.page}
            pageSize={50}
            totalPages={totalPages}
            total={total}
            isLoading={isRefreshing}
            onPageChange={(p) => onFilterChange("page", p)}
          />
        </CardContent>
      </Card>

      <ResourceDrawer
        open={!!selectedEntry}
        title="Event details"
        description="Full details for the selected audit log entry."
        onClose={() => onSelectEntry(null)}
      >
        {selectedEntry && (
          <AuditLogsEventDetail entry={selectedEntry} formatAction={formatAction} />
        )}
      </ResourceDrawer>
    </ResourcePageShell>
  );
}
