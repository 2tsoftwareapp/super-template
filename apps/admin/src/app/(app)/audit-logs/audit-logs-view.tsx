"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import type { AuditLogDto, ListResponse } from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { ResourceToolbar } from "@/components/resource-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { adminResources } from "@/lib/admin-resources";
import { formatDateTime, timeAgo } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

function formatAction(action: string): string {
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AuditLogsView() {
  const auditResource = adminResources.find(
    (resource) => resource.id === "audit-logs",
  )!;
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogDto | null>(null);

  const hasFilters = Boolean(
    actorId || action || resourceType || resourceId || from || to || q,
  );

  const auditLogs = useQuery({
    queryKey: [
      "admin-audit-logs",
      actorId,
      action,
      resourceType,
      resourceId,
      from,
      to,
      q,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50", page: String(page) });
      if (actorId) params.set("actorId", actorId);
      if (action) params.set("action", action);
      if (resourceType) params.set("resourceType", resourceType);
      if (resourceId) params.set("resourceId", resourceId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (q) params.set("q", q);
      return webFetch<ListResponse<AuditLogDto>>(
        `/api/bff/admin/audit-logs?${params.toString()}`,
      );
    },
  });

  const totalPages = auditLogs.data?.meta?.totalPages ?? 1;
  const total = auditLogs.data?.meta?.total ?? 0;

  const clearFilters = () => {
    setActorId("");
    setAction("");
    setResourceType("");
    setResourceId("");
    setFrom("");
    setTo("");
    setQ("");
    setPage(1);
  };

  const entries = auditLogs.data?.data ?? [];

  return (
    <ResourcePageShell
      resource={auditResource}
      description="Track admin actions and quickly inspect who changed what."
      isRefreshing={auditLogs.isFetching}
      onRefresh={() => void auditLogs.refetch()}
    >
      <Card>
        <ResourceToolbar
          search={actorId}
          onSearchChange={(v) => {
            setActorId(v);
            setPage(1);
          }}
          searchPlaceholder="Actor ID"
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          filters={
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Action, e.g. user.created"
                value={action}
                onChange={(event) => {
                  setAction(event.target.value);
                  setPage(1);
                }}
                className="md:max-w-sm"
              />
              <Input
                placeholder="Resource type"
                value={resourceType}
                onChange={(event) => {
                  setResourceType(event.target.value);
                  setPage(1);
                }}
                className="md:max-w-[140px]"
              />
              <Input
                placeholder="Resource ID"
                value={resourceId}
                onChange={(event) => {
                  setResourceId(event.target.value);
                  setPage(1);
                }}
                className="md:max-w-[140px]"
              />
              <Input
                type="date"
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value);
                  setPage(1);
                }}
                className="md:max-w-[150px]"
              />
              <Input
                type="date"
                value={to}
                onChange={(event) => {
                  setTo(event.target.value);
                  setPage(1);
                }}
                className="md:max-w-[150px]"
              />
              <Input
                placeholder="Free-text search"
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
                className="md:max-w-[160px]"
              />
            </div>
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void auditLogs.refetch()}
              disabled={auditLogs.isFetching}
            >
              <RefreshCw
                data-icon="inline-start"
                className={cn(auditLogs.isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          }
          resultLabel={
            auditLogs.data
              ? `${entries.length} events returned${total ? ` (${total} total)` : ""}`
              : "Latest logs returned by the API."
          }
        />
      </Card>

      {/* Events table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription className="text-xs">
            {auditLogs.data
              ? `${entries.length} events returned`
              : "Latest logs returned by the API."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>When</TableHead>
                <TableHead />
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
                  <TableCell
                    colSpan={5}
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    {hasFilters
                      ? "No events match your filters."
                      : "No events found."}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <TableCell className="font-medium text-sm">
                      {formatAction(entry.action)}
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
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {timeAgo(entry.createdAt)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <ResourceDrawer
        open={!!selectedEntry}
        title="Audit log detail"
        description="Full details for the selected event."
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
              <p className="mt-0.5 font-medium">
                {formatAction(selectedEntry.action)}
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
                  <pre className="mt-0.5 whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
                    {JSON.stringify(selectedEntry.metadata, null, 2)}
                  </pre>
                </div>
                <Separator />
              </>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">
                Request ID
              </Label>
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
              <p className="mt-0.5">
                {formatDateTime(selectedEntry.createdAt)}
              </p>
            </div>
          </div>
        )}
      </ResourceDrawer>
    </ResourcePageShell>
  );
}
