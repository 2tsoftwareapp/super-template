"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Tooltip } from "@repo/web-ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";

import type { AuditLogDto } from "@/lib/api-types";

import { formatDateTime, timeAgo } from "@/lib/format";

const columnHelper = createColumnHelper<AuditLogDto>();

export interface AuditLogsColumnOptions {
  formatAction: (action: string) => string;
  onSelectEntry: (entry: AuditLogDto) => void;
}

export function createAuditLogsColumns({ formatAction, onSelectEntry }: AuditLogsColumnOptions) {
  return [
    columnHelper.accessor("createdAt", {
      header: "Time",
      cell: ({ getValue }) => (
        <Tooltip content={formatDateTime(getValue())} side="top">
          <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
            {timeAgo(getValue())}
          </span>
        </Tooltip>
      ),
    }),
    columnHelper.accessor("action", {
      enableSorting: false,
      header: "Action",
      cell: ({ getValue }) => (
        <span className="text-sm font-medium">{formatAction(getValue())}</span>
      ),
    }),
    columnHelper.accessor("entityType", {
      enableSorting: false,
      header: "Entity",
      cell: ({ getValue }) =>
        getValue() ? (
          <Badge variant="secondary" className="text-xs capitalize">
            {getValue().toLowerCase()}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    }),
    columnHelper.accessor("organizationId", {
      enableSorting: false,
      header: "Organization",
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue()!.slice(0, 8)}…
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    }),
    columnHelper.accessor("actorId", {
      enableSorting: false,
      header: "Actor",
      cell: ({ getValue }) =>
        typeof getValue() === "string" && getValue() ? (
          <Tooltip content={getValue()} side="top">
            <span className="cursor-default font-mono text-xs text-muted-foreground">
              {getValue()!.slice(0, 8)}…
            </span>
          </Tooltip>
        ) : (
          <span className="text-xs text-muted-foreground">System</span>
        ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectEntry(row.original);
          }}
        >
          Detail
        </Button>
      ),
    }),
  ];
}
