"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  JobDto,
  ListResponse,
} from "@/lib/api-types";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatDateTime, timeAgo } from "@/lib/format";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";
import { adminResources } from "@/lib/admin-resources";

// ── Status helpers ────────────────────────────────────────────────────────────

function jobStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "COMPLETED") return { variant: "default" };
  if (status === "PENDING") return { variant: "secondary" };
  if (status === "PROCESSING")
    return {
      variant: "secondary",
      className:
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    };
  if (status === "FAILED")
    return {
      variant: "outline",
      className: "text-destructive border-destructive/40",
    };
  if (status === "CANCELLED")
    return {
      variant: "outline",
      className: "text-muted-foreground border-muted-foreground/30",
    };
  return { variant: "outline" };
}

function eventTypeProps(type: string): {
  label: string;
  color: string;
} {
  switch (type) {
    case "claimed":
      return { label: "Claimed", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" };
    case "completed":
      return { label: "Completed", color: "bg-green-500/15 text-green-700 dark:text-green-400" };
    case "failed":
      return { label: "Failed", color: "bg-destructive/15 text-destructive" };
    case "retry_scheduled":
      return { label: "Retry scheduled", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" };
    case "cancelled":
      return { label: "Cancelled", color: "bg-muted text-muted-foreground" };
    default:
      return { label: type, color: "bg-muted text-muted-foreground" };
  }
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({
  label,
  count,
  className,
}: {
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border px-4 py-3", className)}>
      <p className="text-2xl font-bold tabular-nums">{count}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const jobsResource = adminResources.find((r) => r.id === "jobs")!;

export function JobsView() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const jobs = useQuery({
    queryKey: ["admin-jobs", status, type],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      return webFetch<ListResponse<JobDto>>(
        `/api/bff/admin/jobs?${params.toString()}`,
      );
    },
  });

  const metrics = useQuery({
    queryKey: ["admin-jobs-metrics"],
    queryFn: () =>
      webFetch<{ data: import("@/lib/api-types").JobMetricsDto }>("/api/bff/admin/jobs/metrics"),
  });

  const jobDetail = useQuery({
    queryKey: ["admin-job-detail", selectedJobId],
    queryFn: () =>
      webFetch<{ data: JobDto }>(`/api/bff/admin/jobs/${selectedJobId}`),
    enabled: !!selectedJobId,
  });

  const jobLogs = useQuery({
    queryKey: ["admin-job-logs", selectedJobId],
    queryFn: () =>
      webFetch<{ data: import("@/lib/api-types").JobEventDto[] }>(
        `/api/bff/admin/jobs/${selectedJobId}/logs`,
      ),
    enabled: !!selectedJobId,
  });

  const cancelJob = useMutation({
    mutationFn: (id: string) =>
      webFetch<JobDto>(`/api/bff/admin/jobs/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setConfirmCancel(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs-metrics"] });
    },
  });

  const allJobs = useMemo(() => jobs.data?.data ?? [], [jobs.data?.data]);

  const stats = useMemo(
    () => ({
      pending: allJobs.filter((j) => j.status === "PENDING").length,
      processing: allJobs.filter((j) => j.status === "PROCESSING").length,
      failed: allJobs.filter((j) => j.status === "FAILED").length,
      completed: allJobs.filter((j) => j.status === "COMPLETED").length,
    }),
    [allJobs],
  );

  const selectedJob = jobDetail.data?.data;
  const selectedLogs = jobLogs.data?.data ?? [];

  return (
    <ResourcePageShell
      resource={jobsResource}
      description="Inspect queued jobs and cancel stalled work."
    >

      {/* Metrics */}
      {metrics.data?.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip label="Total completed" count={metrics.data.data.totalCompleted} className="border-primary/30 bg-primary/5" />
          <StatChip
            label="Total failed"
            count={metrics.data.data.totalFailed}
            {...(metrics.data.data.totalFailed > 0
              ? { className: "border-destructive/30 bg-destructive/5" }
              : {})}
          />
          <StatChip
            label="Avg duration"
            count={metrics.data.data.averageDurationMs ? Math.round(metrics.data.data.averageDurationMs / 1000) : 0}
            className="border-border"
          />
          <div className="rounded-xl border border-border px-4 py-3">
            <p className="text-2xl font-bold tabular-nums">
              {metrics.data.data.totalCompleted > 0
                ? `${Math.round(
                    (metrics.data.data.retryRate ?? 0) * 100,
                  )}%`
                : "—"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Retry rate</p>
          </div>
        </div>
      )}

      {/* Stats */}
      {!jobs.isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip label="Pending" count={stats.pending} />
          <StatChip
            label="Processing"
            count={stats.processing}
            {...(stats.processing > 0
              ? { className: "border-amber-500/30 bg-amber-500/5" }
              : {})}
          />
          <StatChip
            label="Failed"
            count={stats.failed}
            {...(stats.failed > 0
              ? { className: "border-destructive/30 bg-destructive/5" }
              : {})}
          />
          <StatChip
            label="Completed"
            count={stats.completed}
            className="border-primary/30 bg-primary/5"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void jobs.refetch()}
              disabled={jobs.isFetching}
            >
              <RefreshCw
                className={cn("size-3.5", jobs.isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 pb-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Type
            </label>
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. SEND_NOTIFICATION"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Queue</CardTitle>
          <CardDescription className="text-xs">
            {jobs.data
              ? `${allJobs.length} jobs returned`
              : "Manage scheduled and running jobs."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-1">
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
              {jobs.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : allJobs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    {status || type
                      ? "No jobs match your filters."
                      : "No jobs found."}
                  </TableCell>
                </TableRow>
              ) : (
                allJobs.map((job) => {
                  const { variant, className } = jobStatusProps(job.status);
                  // Backend only allows cancelling PENDING jobs
                  const canCancel = job.status === "PENDING";
                  const isConfirming = confirmCancel === job.id;
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
                          {job.status.toLowerCase()}
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
                            onClick={() => setSelectedJobId(job.id)}
                          >
                            Detail
                          </Button>
                          {canCancel &&
                            (isConfirming ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/5"
                                  disabled={cancelJob.isPending}
                                  onClick={() =>
                                    void cancelJob.mutateAsync(job.id)
                                  }
                                >
                                  {cancelJob.isPending ? (
                                    <Spinner className="size-3" />
                                  ) : (
                                    "Confirm"
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setConfirmCancel(null)}
                                >
                                  Keep
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setConfirmCancel(job.id)}
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
        </CardContent>
      </Card>

      {/* Job detail drawer */}
      <ResourceDrawer
        open={!!selectedJobId}
        title="Job detail"
        description={selectedJob ? `Type: ${selectedJob.type}` : "Loading…"}
        onClose={() => {
          setSelectedJobId(null);
        }}
      >
        {selectedJob ? (
          <div className="space-y-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">ID</Label>
              <p className="mt-0.5 font-mono text-xs">{selectedJob.id}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <p className="mt-0.5 font-mono text-xs">{selectedJob.type}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="mt-0.5">
                <Badge
                  variant={jobStatusProps(selectedJob.status).variant}
                  className={cn(
                    "text-xs capitalize",
                    jobStatusProps(selectedJob.status).className,
                  )}
                >
                  {selectedJob.status.toLowerCase()}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">
                Attempts
              </Label>
              <p className="mt-0.5">
                {selectedJob.attempts} / {selectedJob.maxAttempts}
              </p>
            </div>
            {selectedJob.errorMessage && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Error
                  </Label>
                  <p className="mt-0.5 text-destructive">
                    {String(selectedJob.errorMessage)}
                  </p>
                </div>
              </>
            )}
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Payload</Label>
              <pre className="mt-0.5 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">
                {JSON.stringify(selectedJob.payload, null, 2)}
              </pre>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Created at
                </Label>
                <p className="mt-0.5">
                  {formatDateTime(selectedJob.createdAt)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Updated at
                </Label>
                <p className="mt-0.5">
                  {formatDateTime(selectedJob.updatedAt)}
                </p>
              </div>
              {selectedJob.startedAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Started at
                  </Label>
                  <p className="mt-0.5">
                    {formatDateTime(selectedJob.startedAt != null ? String(selectedJob.startedAt) : null)}
                  </p>
                </div>
              )}
              {selectedJob.completedAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Completed at
                  </Label>
                  <p className="mt-0.5">
                    {formatDateTime(selectedJob.completedAt != null ? String(selectedJob.completedAt) : null)}
                  </p>
                </div>
              )}
            </div>
            <Separator />
            <div>
              <Label className="text-xs text-muted-foreground">Created by</Label>
              <p className="mt-0.5 font-mono text-xs">
                {selectedJob.createdById ?? "System"}
              </p>
            </div>

            {/* Job logs timeline */}
            {selectedJobId && (
              <>
                <Separator className="my-4" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Event timeline
                  </Label>
                  <div className="mt-2 space-y-3">
                    {jobLogs.isLoading ? (
                      <Spinner className="mx-auto size-4" />
                    ) : selectedLogs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No events recorded.
                      </p>
                    ) : (
                      <div className="relative space-y-0">
                        {selectedLogs.map((event, idx) => {
                          const evProps = eventTypeProps(event.type);
                          return (
                            <div key={event.id} className="flex gap-3 pb-4 pl-4 relative">
                              {idx < selectedLogs.length - 1 && (
                                <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                              )}
                              <div className={cn("mt-1 size-3 shrink-0 rounded-full", evProps.color.replace('text', 'bg'))} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-xs font-medium", evProps.color)}>
                                    {evProps.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {timeAgo(event.createdAt)}
                                  </span>
                                </div>
                                {event.message && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {event.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Spinner className="size-5" />
          </div>
        )}
      </ResourceDrawer>
    </ResourcePageShell>
  );
}
