"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Tooltip } from "@repo/web-ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  type LucideIcon,
  RefreshCcw,
  Trash2,
} from "lucide-react";

import type { NotificationJobDto } from "@/lib/api-types";

import { normalizeJobStatus } from "@/features/notifications/model/notifications.constants";
import { formatUnknownDateTime, scalarString, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<NotificationJobDto>();

function statusIcon(status: string): LucideIcon {
  if (status === "COMPLETED") return CheckCircle2;
  if (status === "PROCESSING") return RefreshCcw;
  if (status === "FAILED") return AlertCircle;
  return Clock;
}

export interface NotificationsColumnOptions {
  canCancel: boolean;
  isCancelling: boolean;
  statusProps: (status: string) => {
    variant: "default" | "secondary" | "outline";
    className?: string;
  };
  onCancel: (jobId: string) => void;
}

export function createNotificationsColumns({
  canCancel,
  isCancelling,
  statusProps,
  onCancel,
}: NotificationsColumnOptions) {
  return [
    columnHelper.accessor("type", {
      enableSorting: false,
      header: "Type",
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
    }),
    columnHelper.accessor("audience", {
      enableSorting: false,
      header: "Audience",
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {getValue()?.toLowerCase() ?? "—"}
        </Badge>
      ),
    }),
    columnHelper.accessor("status", {
      enableSorting: false,
      header: "Status",
      cell: ({ row }) => {
        const s = normalizeJobStatus(row.original.status);
        const sb = statusProps(s);
        const Icon = statusIcon(s);
        return (
          <Tooltip
            content={
              s === "FAILED" && row.original.errorMessage
                ? scalarString(row.original.errorMessage)
                : s
            }
            side="top"
          >
            <Badge variant={sb.variant} className={cn("gap-1 text-xs capitalize", sb.className)}>
              <Icon className="size-3" />
              {s.toLowerCase()}
            </Badge>
          </Tooltip>
        );
      },
    }),
    columnHelper.accessor("recipientCount", {
      enableSorting: false,
      header: "Recipients",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{scalarString(getValue())}</span>
      ),
    }),
    columnHelper.accessor("scheduledAt", {
      header: "Scheduled",
      cell: ({ row }) => (
        <Tooltip
          content={
            row.original.processedAt
              ? `Processed ${formatUnknownDateTime(row.original.processedAt)}`
              : formatUnknownDateTime(row.original.scheduledAt)
          }
          side="top"
        >
          <span className="text-xs text-muted-foreground">
            {timeAgo(scalarString(row.original.scheduledAt, ""))}
          </span>
        </Tooltip>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const s = normalizeJobStatus(row.original.status);
        return canCancel && s === "PENDING" ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            disabled={isCancelling}
            aria-label="Cancel scheduled notification"
            onClick={() => onCancel(row.original.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null;
      },
    }),
  ];
}
