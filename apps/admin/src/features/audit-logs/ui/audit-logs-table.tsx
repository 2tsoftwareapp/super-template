"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { SectionLoading } from "@repo/web-ui/loading";
import { Pagination } from "@repo/web-ui/pagination";
import { Show } from "@repo/web-ui/show";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-ui/table";
import { Tooltip } from "@repo/web-ui/tooltip";

import type { AuditLogsViewModel } from "@/features/audit-logs/controllers/use-audit-logs-controller";

import { formatAuditAction } from "@/features/audit-logs/model/audit-logs.filters";
import { formatDateTime, timeAgo } from "@/lib/format";

interface AuditLogsTableProps {
  entries: AuditLogsViewModel["entries"];
  isLoading: boolean;
  hasFilters: boolean;
  total: number;
  totalPages: number;
  page: number;
  isRefreshing: boolean;
  onSelectEntry: AuditLogsViewModel["onSelectEntry"];
  onPageChange: (page: number) => void;
}

export function AuditLogsTable({
  entries,
  isLoading,
  hasFilters,
  total,
  totalPages,
  page,
  isRefreshing,
  onSelectEntry,
  onPageChange,
}: AuditLogsTableProps) {
  return (
    <>
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
            <TableHead>Organization</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <Show when={isLoading}>
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center">
                <SectionLoading />
              </TableCell>
            </TableRow>
          </Show>
          {!isLoading && entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
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
                  {entry.organizationId ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {entry.organizationId.slice(0, 8)}…
                    </span>
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
        page={page}
        pageSize={50}
        totalPages={totalPages}
        total={total}
        isLoading={isRefreshing}
        onPageChange={onPageChange}
      />
    </>
  );
}
