"use client";

import { Button } from "@repo/web-ui/button";
import { Card, CardContent } from "@repo/web-ui/card";
import { DatePicker } from "@repo/web-ui/date-picker";
import { Input } from "@repo/web-ui/input";
import { Spinner } from "@repo/web-ui/spinner";
import { Download, Search, X } from "lucide-react";

import type { AuditLogsViewModel } from "@/features/audit-logs/controllers/use-audit-logs-controller";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/lib/admin-resources";

import { AuditLogsEventDetail } from "./audit-logs-event-detail";
import { AuditLogsTable } from "./audit-logs-table";

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
  entries,
  total,
  totalPages,
  selectedEntry,
  onSelectEntry,
  onExport,
  isExporting,
}: AuditLogsViewModel) {
  return (
    <ResourcePageShell
      resource={auditLogsResource}
      description="Who changed what, and when."
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
    >
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 pb-4">
          <div className="relative flex-1 basis-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events…"
              value={filters.q}
              onChange={(e) => onFilterChange("q", e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              value={filters.from}
              onChange={(v) => onFilterChange("from", v)}
              placeholder="From"
              className="h-7 text-xs"
            />
            <DatePicker
              value={filters.to}
              onChange={(v) => onFilterChange("to", v)}
              placeholder="To"
              className="h-7 text-xs"
            />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-7 px-2 text-xs"
              >
                <X className="size-3.5" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isExporting}
              className="h-7 px-2 text-xs"
            >
              {isExporting ? (
                <Spinner className="size-3.5" />
              ) : (
                <Download className="size-3.5" />
              )}
              Export
            </Button>
          </div>
        </div>

        <CardContent className="p-0 pb-1">
          {hasError ? (
            <p className="p-4 text-center text-xs text-destructive">
              Failed to load audit logs.{" "}
              <button
                type="button"
                onClick={onRefresh}
                className="underline underline-offset-2"
              >
                Try again
              </button>
            </p>
          ) : (
            <AuditLogsTable
              entries={entries}
              isLoading={isLoading}
              hasFilters={hasFilters}
              total={total}
              totalPages={totalPages}
              page={filters.page}
              isRefreshing={isRefreshing}
              onSelectEntry={onSelectEntry}
              onPageChange={(p) => onFilterChange("page", p)}
            />
          )}
        </CardContent>
      </Card>

      <ResourceDrawer
        open={!!selectedEntry}
        title="Event details"
        description="Full details for the selected audit log entry."
        onClose={() => onSelectEntry(null)}
      >
        {selectedEntry && <AuditLogsEventDetail entry={selectedEntry} />}
      </ResourceDrawer>
    </ResourcePageShell>
  );
}
