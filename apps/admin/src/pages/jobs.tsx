import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Spinner } from "../components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import { timeAgo } from "../lib/format";
import type { JobDto, ListResponse } from "../lib/types";
import { cn } from "../lib/utils";

// ── Status helpers ────────────────────────────────────────────────────────────

function jobStatusProps(status: string): {
  variant: "default" | "secondary" | "outline";
  className?: string;
} {
  if (status === "COMPLETED") return { variant: "default" };
  if (status === "PENDING") return { variant: "secondary" };
  if (status === "PROCESSING") return { variant: "secondary", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" };
  if (status === "FAILED") return { variant: "outline", className: "text-destructive border-destructive/40" };
  return { variant: "outline" };
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, count, className }: { label: string; count: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border px-4 py-3", className)}>
      <p className="text-2xl font-bold tabular-nums">{count}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function JobsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const jobs = useQuery({
    queryKey: ["admin-jobs", status, type],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      return webFetch<ListResponse<JobDto>>(`/api/v1/admin/jobs?${params.toString()}`);
    },
  });

  const cancelJob = useMutation({
    mutationFn: (id: string) =>
      webFetch<JobDto>(`/api/v1/admin/jobs/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setConfirmCancel(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
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

  return (
    <div className="space-y-6">
      <PageHeader
        label="Jobs"
        title="Background jobs"
        description="Inspect queued jobs and cancel stalled work."
      />

      {/* Stats */}
      {!jobs.isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip label="Pending" count={stats.pending} />
          <StatChip
            label="Processing"
            count={stats.processing}
            {...(stats.processing > 0 ? { className: "border-amber-500/30 bg-amber-500/5" } : {})}
          />
          <StatChip
            label="Failed"
            count={stats.failed}
            {...(stats.failed > 0 ? { className: "border-destructive/30 bg-destructive/5" } : {})}
          />
          <StatChip label="Completed" count={stats.completed} className="border-primary/30 bg-primary/5" />
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
              <RefreshCw className={cn("size-3.5", jobs.isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 pb-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
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
            <label className="text-xs font-medium text-muted-foreground">Type</label>
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
            {jobs.data ? `${allJobs.length} jobs returned` : "Manage scheduled and running jobs."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <Spinner className="mx-auto size-5" />
                  </TableCell>
                </TableRow>
              ) : allJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center text-sm text-muted-foreground">
                    {status || type ? "No jobs match your filters." : "No jobs found."}
                  </TableCell>
                </TableRow>
              ) : (
                allJobs.map((job) => {
                  const { variant, className } = jobStatusProps(job.status);
                  const canCancel = job.status === "PENDING" || job.status === "PROCESSING";
                  const isConfirming = confirmCancel === job.id;
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">{job.type}</TableCell>
                      <TableCell>
                        <Badge variant={variant} className={cn("text-xs capitalize", className)}>
                          {job.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {timeAgo(job.scheduledAt)}
                      </TableCell>
                      <TableCell>
                        {canCancel && (
                          isConfirming ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/5"
                                disabled={cancelJob.isPending}
                                onClick={() => void cancelJob.mutateAsync(job.id)}
                              >
                                {cancelJob.isPending ? <Spinner className="size-3" /> : "Confirm"}
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
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
