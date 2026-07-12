"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import { Card, CardContent } from "@repo/web-core/components/card";
import { DatePicker } from "@repo/web-core/components/date-picker";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { SectionLoading } from "@repo/web-core/components/loading";
import { Pagination } from "@repo/web-core/components/pagination";
import { Separator } from "@repo/web-core/components/separator";
import { Show } from "@repo/web-core/components/show";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-core/components/table";
import { Tooltip } from "@repo/web-core/components/tooltip";
import { Search, X } from "lucide-react";

import type { AuditLogsViewModel } from "@/features/audit-logs/controllers/use-audit-logs-controller";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { formatAuditAction } from "@/features/audit-logs/model/audit-logs-filters";
import { adminResources } from "@/lib/admin-resources";
import { formatDateTime, timeAgo } from "@/lib/format";

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
  onRefresh,
  entries,
  total,
  totalPages,
  selectedEntry,
  onSelectEntry,
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
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events…"
                value={filters.q}
                onChange={(e) => onFilterChange("q", e.target.value)}
                className="h-7 w-[180px] pl-7 text-xs"
              />
            </div>
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
          </div>
        </div>

        <CardContent className="p-0 pb-1">
          {total > 0 && (
            <div className="px-4 pt-3 pb-1 text-xs text-muted-foreground">
              {total} event{total !== 1 ? "s" : ""}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <Show when={isLoading}>
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <SectionLoading />
                  </TableCell>
                </TableRow>
              </Show>
              {!isLoading && entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    {hasFilters
                      ? "No events match your filters."
                      : "No events recorded yet."}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => onSelectEntry(entry)}
                  >
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      <Tooltip
                        content={formatDateTime(entry.createdAt)}
                        side="top"
                      >
                        <span>{timeAgo(entry.createdAt)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatAuditAction(entry.action)}
                    </TableCell>
                    <TableCell>
                      {entry.entityType ? (
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {entry.entityType.toLowerCase()}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {typeof entry.actorId === "string" && entry.actorId ? (
                        <Tooltip content={entry.actorId} side="top">
                          <span className="cursor-default font-mono text-xs text-muted-foreground">
                            {entry.actorId.slice(0, 8)}…
                          </span>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          System
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntry(entry);
                        }}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

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
          <div className="space-y-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">ID</Label>
              <p className="mt-0.5 font-mono text-xs">{selectedEntry.id}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Action</Label>
              <p className="mt-0.5 font-medium">
                {formatAuditAction(selectedEntry.action)}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">
                Entity type
              </Label>
              <p className="mt-0.5">{selectedEntry.entityType ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Entity ID</Label>
              <p className="mt-0.5 font-mono text-xs">
                {selectedEntry.entityId ?? "—"}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Actor ID</Label>
              <p className="mt-0.5 font-mono text-xs">
                {selectedEntry.actorId ?? "System"}
              </p>
            </div>
            <Separator />
            {selectedEntry.metadata && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Metadata
                  </Label>
                  <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
                <Separator />
              </>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Request ID</Label>
              <p className="mt-0.5 font-mono text-xs">
                {selectedEntry.requestId ?? "—"}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">IP address</Label>
              <p className="mt-0.5 font-mono text-xs">
                {selectedEntry.ipAddress ?? "—"}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">User agent</Label>
              <p className="mt-0.5 break-all text-xs text-muted-foreground">
                {selectedEntry.userAgent ?? "—"}
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Created at</Label>
              <p className="mt-0.5">{formatDateTime(selectedEntry.createdAt)}</p>
            </div>
          </div>
        )}
      </ResourceDrawer>
    </ResourcePageShell>
  );
}
