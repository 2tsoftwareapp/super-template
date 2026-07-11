"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
} from "@repo/web-core/components/card";
import { DatePicker } from "@repo/web-core/components/date-picker";
import { Input } from "@repo/web-core/components/input";
import { Label } from "@repo/web-core/components/label";
import { Pagination } from "@repo/web-core/components/pagination";
import { Separator } from "@repo/web-core/components/separator";
import { Spinner } from "@repo/web-core/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-core/components/table";
import { Tooltip } from "@repo/web-core/components/tooltip";
import { useDebouncedValue } from "@repo/web-core/hooks";
import { Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import type { AuditLogDto } from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { useAuditLogsQuery } from "@/features/audit-logs/use-audit-logs-queries";
import { usePathname, useRouter } from "@/i18n/navigation";
import { adminResources } from "@/lib/admin-resources";
import { formatDateTime, timeAgo } from "@/lib/format";

function formatAction(action: string): string {
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Filters {
  from: string;
  to: string;
  q: string;
  page: number;
}

function parseFilters(sp: URLSearchParams): Filters {
  return {
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    q: sp.get("q") ?? "",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

export function AuditLogsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>(() =>
    parseFilters(new URLSearchParams(searchParams.toString())),
  );
  const [selectedEntry, setSelectedEntry] = useState<AuditLogDto | null>(null);

  const updateFilter = (key: keyof Filters, value: string | number) => {
    const next = { ...filters, [key]: value };
    if (key !== "page") next.page = 1;
    setFilters(next);

    const sp = new URLSearchParams();
    if (next.from) sp.set("from", next.from);
    if (next.to) sp.set("to", next.to);
    if (next.q) sp.set("q", next.q);
    if (next.page > 1) sp.set("page", String(next.page));
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const hasFilters = Boolean(filters.from || filters.to || filters.q);

  const clearFilters = () => {
    const reset: Filters = { from: "", to: "", q: "", page: 1 };
    setFilters(reset);
    router.replace(pathname, { scroll: false });
  };

  const q = useDebouncedValue(filters.q, 400);

  const auditLogs = useAuditLogsQuery({
    page: filters.page,
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
    q,
  });

  const totalPages = auditLogs.data?.meta?.totalPages ?? 1;
  const total = auditLogs.data?.meta?.total ?? 0;
  const entries = auditLogs.data?.data ?? [];

  return (
    <ResourcePageShell
      resource={adminResources.find((r) => r.id === "audit-logs")!}
      description="Who changed what, and when."
      isRefreshing={auditLogs.isFetching}
      onRefresh={() => void auditLogs.refetch()}
    >
      <Card>
        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 pb-4">
          <div className="relative flex-1 basis-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events…"
              value={filters.q}
              onChange={(e) => updateFilter("q", e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              value={filters.from}
              onChange={(v) => updateFilter("from", v)}
              placeholder="From"
              className="h-7 text-xs"
            />
            <DatePicker
              value={filters.to}
              onChange={(v) => updateFilter("to", v)}
              placeholder="To"
              className="h-7 text-xs"
            />
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events…"
                value={filters.q}
                onChange={(e) => updateFilter("q", e.target.value)}
                className="h-7 w-[180px] pl-7 text-xs"
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 text-xs">
                <X className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
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
              {auditLogs.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
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
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      <Tooltip content={formatDateTime(entry.createdAt)} side="top">
                        <span>{timeAgo(entry.createdAt)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatAction(entry.action)}
                    </TableCell>
                    <TableCell>
                      {entry.entityType ? (
                        <Badge variant="secondary" className="text-xs capitalize">
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
                        <span className="text-xs text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
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
            isLoading={auditLogs.isFetching}
            onPageChange={(p) => updateFilter("page", p)}
          />
        </CardContent>
      </Card>

      {/* ── Detail drawer ── */}
      <ResourceDrawer
        open={!!selectedEntry}
        title="Event details"
        description="Full details for the selected audit log entry."
        onClose={() => setSelectedEntry(null)}
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
              <p className="mt-0.5 font-medium">{formatAction(selectedEntry.action)}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Entity type</Label>
              <p className="mt-0.5">{selectedEntry.entityType ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Entity ID</Label>
              <p className="mt-0.5 font-mono text-xs">{selectedEntry.entityId ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Actor ID</Label>
              <p className="mt-0.5 font-mono text-xs">{selectedEntry.actorId ?? "System"}</p>
            </div>
            <Separator />
            {selectedEntry.metadata && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Metadata</Label>
                  <pre className="mt-0.5 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
                <Separator />
              </>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Request ID</Label>
              <p className="mt-0.5 font-mono text-xs">{selectedEntry.requestId ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">IP address</Label>
              <p className="mt-0.5 font-mono text-xs">{selectedEntry.ipAddress ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">User agent</Label>
              <p className="mt-0.5 break-all text-xs text-muted-foreground">{selectedEntry.userAgent ?? "—"}</p>
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
