"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import { SectionLoading } from "@repo/web-core/components/loading";
import { LoadingButton } from "@repo/web-core/components/loading-button";
import { Pagination } from "@repo/web-core/components/pagination";
import { Show } from "@repo/web-core/components/show";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-core/components/table";

import type { JobDto } from "@/lib/api-types";

import { jobStatusProps } from "@/features/jobs/model/constants";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface JobsTableProps {
  jobs: JobDto[];
  isLoading: boolean;
  emptyMessage: string;
  confirmId: string | null;
  cancelPending: boolean;
  onDetail: (jobId: string) => void;
  onCancelRequest: (jobId: string) => void;
  onCancelConfirm: () => void;
  onCancelDismiss: () => void;
}

export function JobsTable({
  jobs,
  isLoading,
  emptyMessage,
  confirmId,
  cancelPending,
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
        {!isLoading && jobs.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="py-16 text-center text-sm text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          jobs.map((job) => {
            const s = job.status ?? "";
            const { variant, className } = jobStatusProps(s);
            const canCancel = s === "PENDING";
            const isConfirming = confirmId === job.id;
            return (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-xs">
                  {job.type}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={variant}
                    className={cn("text-xs capitalize", className)}
                  >
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
                    {canCancel &&
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
        )}
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
