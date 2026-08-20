"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { createColumnHelper } from "@tanstack/react-table";

import type { JobDto } from "@/lib/api-types";

import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<JobDto>();

export interface JobsColumnOptions {
  canCancel: boolean;
  confirmId: string | null;
  cancelPending: boolean;
  statusProps: (status: string) => {
    variant: "default" | "secondary" | "outline";
    className?: string;
  };
  onDetail: (jobId: string) => void;
  onCancelRequest: (jobId: string) => void;
  onCancelConfirm: () => void;
  onCancelDismiss: () => void;
}

export function createJobsColumns({
  canCancel,
  confirmId,
  cancelPending,
  statusProps,
  onDetail,
  onCancelRequest,
  onCancelConfirm,
  onCancelDismiss,
}: JobsColumnOptions) {
  return [
    columnHelper.accessor("type", {
      enableSorting: false,
      header: "Type",
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue()}</span>,
    }),
    columnHelper.accessor("status", {
      enableSorting: false,
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() ?? "";
        const { variant, className } = statusProps(status);
        return (
          <Badge variant={variant} className={cn("text-xs capitalize", className)}>
            {status.toLowerCase()}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("attempts", {
      enableSorting: false,
      header: "Attempts",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.attempts}/{row.original.maxAttempts}
        </span>
      ),
    }),
    columnHelper.accessor("scheduledAt", {
      header: "Scheduled",
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{timeAgo(getValue())}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const job = row.original;
        const status = job.status ?? "";
        const showCancel = canCancel && status === "PENDING";
        const isConfirming = confirmId === job.id;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onDetail(job.id)}
            >
              Detail
            </Button>
            {showCancel &&
              (isConfirming ? (
                <div className="flex items-center gap-2">
                  <LoadingButton
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/5"
                    onClick={onCancelConfirm}
                    loading={cancelPending}
                  >
                    Confirm
                  </LoadingButton>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={onCancelDismiss}
                  >
                    Keep
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onCancelRequest(job.id)}
                >
                  Cancel
                </Button>
              ))}
          </div>
        );
      },
    }),
  ];
}
