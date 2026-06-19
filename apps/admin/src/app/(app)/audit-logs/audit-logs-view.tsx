"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import type { AuditLogDto, ListResponse } from "@/lib/api-types";

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
import { timeAgo } from "@/lib/format";
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

  const hasFilters = Boolean(actorId || action);

  const auditLogs = useQuery({
    queryKey: ["admin-audit-logs", actorId, action],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (actorId) params.set("actorId", actorId);
      if (action) params.set("action", action);
      return webFetch<ListResponse<AuditLogDto>>(
        `/api/bff/admin/audit-logs?${params.toString()}`,
      );
    },
  });

  const clearFilters = () => {
    setActorId("");
    setAction("");
  };

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
          onSearchChange={setActorId}
          searchPlaceholder="Actor ID"
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          filters={
            <Input
              placeholder="Action, e.g. user.created"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="md:max-w-sm"
            />
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
              ? `${auditLogs.data.data.length} events returned`
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
                  <TableCell
                    colSpan={4}
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    {hasFilters
                      ? "No events match your filters."
                      : "No events found."}
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
    </ResourcePageShell>
  );
}
