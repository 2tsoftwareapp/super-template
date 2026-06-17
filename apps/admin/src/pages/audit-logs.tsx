import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Search, X } from "lucide-react";
import { useState } from "react";

import type { AuditLogDto, ListResponse } from "../lib/types";

import { PageHeader } from "../components/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Spinner } from "../components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tooltip } from "../components/ui/tooltip";
import { timeAgo } from "../lib/format";
import { webFetch } from "../lib/http";
import { cn } from "../lib/utils";

function formatAction(action: string): string {
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AuditLogsPage() {
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");

  const hasFilters = Boolean(actorId || action);

  const auditLogs = useQuery({
    queryKey: ["admin-audit-logs", actorId, action],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (actorId) params.set("actorId", actorId);
      if (action) params.set("action", action);
      return webFetch<ListResponse<AuditLogDto>>(`/api/v1/admin/audit-logs?${params.toString()}`);
    },
  });

  const clearFilters = () => {
    setActorId("");
    setAction("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        label="Audit"
        title="Audit logs"
        description="Track admin actions and quickly inspect who changed what."
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription className="text-xs">Query the recent audit stream.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                  <X className="size-3" />
                  Clear
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => void auditLogs.refetch()}
                disabled={auditLogs.isFetching}
              >
                <RefreshCw className={cn("size-3.5", auditLogs.isFetching && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 pb-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Actor ID"
              className="pl-8"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
            />
          </div>
          <Input
            placeholder="Action (e.g. user.created)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Events table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription className="text-xs">
            {auditLogs.data
              ? `${auditLogs.data.data.length} events returned`
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : (auditLogs.data?.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center text-sm text-muted-foreground">
                    {hasFilters ? "No events match your filters." : "No events found."}
                  </TableCell>
                </TableRow>
              ) : (
                (auditLogs.data?.data ?? []).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-sm">
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
                    <TableCell className="text-xs text-muted-foreground">
                      {timeAgo(entry.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
