"use client";

import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { LoadingButton } from "@repo/web-ui/loading-button";
import { Pagination } from "@repo/web-ui/pagination";
import { Show } from "@repo/web-ui/show";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/web-ui/table";

import type { JobDto } from "@/lib/api-types";

import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface JobsTableProps {
  jobs: JobDto[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  emptyMessage: string;
  confirmId: string | null;
  cancelPending: boolean;
  canCancel: boolean;
  statusProps: (status: string) => {
    variant: "default" | "secondary" | "outline";
    className?: string;
  };
  onDetail: (jobId: string) => void;
  onCancelRequest: (jobId: string) => void;
  onCancelConfirm: () => void;
  onCancelDismiss: () => void;
}

export function JobsTable({
  jobs,
  isLoading,
  isError,
  onRetry,
  emptyMessage,
  confirmId,
  cancelPending,
  canCancel,
  statusProps,
  onDetail,
  onCancelRequest,
  onCancelConfirm,
  onCancelDismiss,
}: JobsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Attempts</TableHead>
          <TableHead>Scheduled</TableHead>
          <TableHead />
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
        {!isLoading && isError ? (
          <TableRow>
            <TableCell colSpan={5} className="py-8">
              <ErrorState
                variant="inline"
                className="m-0"
                title="Could not load jobs."
                action={{ label: "Retry", onClick: onRetry }}
              />
            </TableCell>
          </TableRow>
        ) : null}
        {!isLoading && !isError && jobs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : null}
        {!isLoading && !isError
          ? jobs.map((job) => {
              const s = job.status ?? "";
              const { variant, className } = statusProps(s);
              const showCancel = canCancel && s === "PENDING";
              const isConfirming = confirmId === job.id;
              return (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-xs">{job.type}</TableCell>
                  <TableCell>
                    <Badge variant={variant} className={cn("text-xs capitalize", className)}>
                      {s.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {job.attempts}/{job.maxAttempts}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {timeAgo(job.scheduledAt)}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              );
            })
          : null}
      </TableBody>
    </Table>
  );
}

export function JobsTablePagination(props: {
  page: number;
  totalPages: number;
  total: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <Pagination
      page={props.page}
      pageSize={50}
      totalPages={props.totalPages}
      total={props.total}
      isLoading={props.isFetching}
      onPageChange={props.onPageChange}
    />
  );
}
