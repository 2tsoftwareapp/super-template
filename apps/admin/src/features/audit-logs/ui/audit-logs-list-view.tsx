"use client";

import { Button } from "@repo/web-ui/button";
import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/web-ui/dropdown-menu";
import { ResourceDataTable } from "@repo/web-ui/resource-data-table";
import { ResourceDetailPane } from "@repo/web-ui/resource-detail-pane";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { Spinner } from "@repo/web-ui/spinner";
import { ChevronDown, Download, FileJson, FileSpreadsheet } from "lucide-react";

import type { AuditLogsViewModel } from "@/features/audit-logs/model/audit-logs.types";

import { adminResources } from "@/features/_plugin-resources/admin-resources";

import { AuditLogsEventDetail } from "./audit-logs-event-detail";

const auditLogsResource = adminResources.find((r) => r.id === "audit-logs")!;

/**
 * Presentational audit-logs view. Standardized on CommonResourcePage architecture.
 * Receives a fully-resolved view model from the audit-logs controller and renders it;
 * it owns no server state, URL state, or orchestration.
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
  onExportJson,
  isExporting,
  formatAction,
  table,
}: AuditLogsViewModel) {
  return (
    <CommonResourcePage
      resource={auditLogsResource}
      description="Who changed what, and when."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      filterBar={
        <ResourceFilterBar
          search={{
            value: filters.q,
            onChange: (value) => onFilterChange("q", value),
            placeholder: "Search events, actors, resources…",
          }}
          dateRange={{
            from: filters.from,
            to: filters.to,
            onChange: ({ from, to }) => {
              onFilterChange("from", from);
              onFilterChange("to", to);
            },
          }}
          onClearAll={onClearFilters}
          actions={
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={isExporting}
                aria-label="Export"
              >
                {isExporting ? <Spinner className="size-3.5" /> : <Download className="size-3.5" />}
                Export
              </Button>
              {onExportJson ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2"
                      aria-label="Export options"
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onExport} disabled={isExporting}>
                      <FileSpreadsheet className="size-3.5" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportJson}>
                      <FileJson className="size-3.5" />
                      Export as JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          }
        />
      }
      pagination={{
        page: filters.page,
        pageSize: 50,
        total,
        totalPages,
        isLoading: isRefreshing,
        onPageChange: (p) => onFilterChange("page", p),
      }}
      detailPane={
        <ResourceDetailPane
          open={!!selectedEntry}
          onClose={() => onSelectEntry(null)}
          title="Event details"
          description="Full details and payload for the selected audit log entry."
          id={selectedEntry?.id}
        >
          {selectedEntry && (
            <AuditLogsEventDetail entry={selectedEntry} formatAction={formatAction} />
          )}
        </ResourceDetailPane>
      }
    >
      <ResourceDataTable
        table={table}
        isLoading={isLoading}
        error={hasError ? { title: "Could not load audit logs.", onRetry: onRefresh } : undefined}
        onRowClick={(row) => onSelectEntry(row)}
        empty={{
          title: hasFilters ? "No events match your filters." : "No events recorded yet.",
        }}
      />
    </CommonResourcePage>
  );
}
