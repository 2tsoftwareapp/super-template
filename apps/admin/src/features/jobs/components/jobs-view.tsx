"use client";

import { Badge } from "@repo/web-core/components/badge";
import { Button } from "@repo/web-core/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { Label } from "@repo/web-core/components/label";
import { Pagination } from "@repo/web-core/components/pagination";
import { Separator } from "@repo/web-core/components/separator";
import { Spinner } from "@repo/web-core/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/web-core/components/table";
import { RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ResourceDrawer } from "@/components/resource-drawer";
import { ResourcePageShell } from "@/components/resource-page-shell";
import { useCancelJobMutation } from "@/features/jobs/use-jobs-mutations";
import {
  useJobDetailQuery,
  useJobLogsQuery,
  useJobMetricsQuery,
  useJobsQuery,
} from "@/features/jobs/use-jobs-queries";
import { usePathname, useRouter } from "@/i18n/navigation";
import { adminResources } from "@/lib/admin-resources";
import { formatDateTime, formatUnknownDateTime, scalarString, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function jobStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "COMPLETED") return { variant: "default" };
  if (status === "PENDING") return { variant: "secondary" };
  if (status === "PROCESSING")
    return {
      variant: "secondary",
      className: "bg-accent text-accent-foreground border-border",
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

const EVENT_STYLES: Record<string, { label: string; dot: string; text: string }> = {
  claimed: { label: "Claimed", dot: "bg-chart-5", text: "text-muted-foreground" },
  completed: { label: "Completed", dot: "bg-primary", text: "text-primary" },
  failed: { label: "Failed", dot: "bg-destructive", text: "text-destructive" },
  retry_scheduled: { label: "Retry scheduled", dot: "bg-chart-2", text: "text-chart-2" },
  cancelled: { label: "Cancelled", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

function eventTypeProps(type: string) {
  return EVENT_STYLES[type] ?? { label: type, dot: "bg-muted-foreground", text: "text-muted-foreground" };
}

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

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface Filters {
  status: string;
  type: string;
  page: number;
}

function parseFilters(sp: URLSearchParams): Filters {
  return {
    status: sp.get("status") ?? "",
    type: sp.get("type") ?? "",
    page: Math.max(1, Number(sp.get("page")) || 1),
  };
}

const jobsResource = adminResources.find((r) => r.id === "jobs")!;

export function JobsView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>(() =>
    parseFilters(new URLSearchParams(searchParams.toString())),
  );
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const updateFilter = (key: keyof Filters, value: string | number) => {
    const next = { ...filters, [key]: value };
    if (key !== "page") next.page = 1;
    setFilters(next);
    const sp = new URLSearchParams();
    if (next.status) sp.set("status", next.status);
    if (next.type) sp.set("type", next.type);
    if (next.page > 1) sp.set("page", String(next.page));
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const jobs = useJobsQuery({
    status: filters.status || undefined,
    type: filters.type || undefined,
    page: filters.page,
  });

  const metrics = useJobMetricsQuery();

  const jobDetail = useJobDetailQuery(selectedJobId ?? undefined);

  const jobLogs = useJobLogsQuery(selectedJobId ?? undefined);

  const cancelJob = useCancelJobMutation({
    onSuccess: () => {
      setConfirmCancel(null);
    },
  });

  const allJobs = jobs.data?.data ?? [];
  const totalPages = jobs.data?.meta?.totalPages ?? 1;
  const total = jobs.data?.meta?.total ?? 0;
  const selectedJob = jobDetail.data?.data;
  const selectedLogs = jobLogs.data?.data ?? [];

  return (
    <ResourcePageShell
      resource={jobsResource}
      description="Inspect queued background jobs and cancel stalled work."
      isRefreshing={jobs.isFetching || metrics.isFetching}
      onRefresh={() => {
        void jobs.refetch();
        void metrics.refetch();
      }}
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

      {/* Stats from metrics (not client-side) */}
      {metrics.data?.data && (() => {
        const byStatus = metrics.data.data.byStatus ?? [];
        const getCount = (s: string) => byStatus.find((b) => b.status === s)?.total ?? 0;
        const totalPending = getCount("PENDING");
        const totalProcessing = getCount("PROCESSING");
        const totalFailed = metrics.data.data.totalFailed;
        const totalCompleted = metrics.data.data.totalCompleted;
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatChip label="Pending" count={totalPending} />
            <StatChip
              label="Processing"
              count={totalProcessing}
              {...(totalProcessing > 0
                ? { className: "border-border bg-accent" }
                : {})}
            />
            <StatChip
              label="Failed"
              count={totalFailed}
              {...(totalFailed > 0
                ? { className: "border-destructive/30 bg-destructive/5" }
                : {})}
            />
            <StatChip
              label="Completed"
              count={totalCompleted}
              className="border-primary/30 bg-primary/5"
            />
          </div>
        );
      })()}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => jobs.refetch()}
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
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Type
            </label>
            <input
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-hidden transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="e.g. SEND_NOTIFICATION"
              value={filters.type}
              onChange={(e) => updateFilter("type", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Queue</CardTitle>
          <CardDescription className="text-xs">
            {total > 0
              ? `${total} job${total !== 1 ? "s" : ""}`
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
                    {filters.status || filters.type
                      ? "No jobs match your filters."
                      : "No jobs found."}
                  </TableCell>
                </TableRow>
              ) : (
                allJobs.map((job) => {
                  const s = job.status ?? "";
                  const { variant, className } = jobStatusProps(s);
                  const canCancel = s === "PENDING";
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
                                    cancelJob.mutate(job.id)
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

          <Pagination
            page={filters.page}
            pageSize={50}
            totalPages={totalPages}
            total={total}
            isLoading={jobs.isFetching}
            onPageChange={(p) => updateFilter("page", p)}
          />
        </CardContent>
      </Card>

      {/* Job detail drawer */}
      <ResourceDrawer
        open={!!selectedJobId}
        title="Job detail"
        description={selectedJob ? `Type: ${selectedJob.type}` : "Loading…"}
        onClose={() => setSelectedJobId(null)}
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
                  variant={jobStatusProps(selectedJob.status ?? "").variant}
                  className={cn(
                    "text-xs capitalize",
                    jobStatusProps(selectedJob.status ?? "").className,
                  )}
                >
                  {String(selectedJob.status).toLowerCase()}
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
                    {scalarString(selectedJob.errorMessage)}
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
                    {formatUnknownDateTime(selectedJob.startedAt)}
                  </p>
                </div>
              )}
              {selectedJob.completedAt && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Completed at
                  </Label>
                  <p className="mt-0.5">
                    {formatUnknownDateTime(selectedJob.completedAt)}
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
                <Separator />
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
                          const evProps = eventTypeProps(String(event.type));
                          return (
                            <div
                              key={`${String(event.createdAt)}-${String(event.type)}-${idx}`}
                              className="flex gap-3 pb-4 pl-4 relative"
                            >
                              {idx < selectedLogs.length - 1 && (
                                <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                              )}
                              <div className={cn("mt-1 size-3 shrink-0 rounded-full", evProps.dot)} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-xs font-medium", evProps.text)}>
                                    {evProps.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {timeAgo(String(event.createdAt))}
                                  </span>
                                </div>
                                {event.message && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {String(event.message)}
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
