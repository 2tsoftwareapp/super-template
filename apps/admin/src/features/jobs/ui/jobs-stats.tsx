"use client";

import type { JobMetricsDto } from "@/lib/api-types";

import { getStatusCount } from "@/features/jobs/model/jobs.metrics";
import { cn } from "@/lib/utils";

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

export function JobsMetricsRow({ metrics }: { metrics: JobMetricsDto }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatChip label="Total completed" count={metrics.totalCompleted} className="border-primary/30 bg-primary/5" />
      <StatChip
        label="Total failed"
        count={metrics.totalFailed}
        {...(metrics.totalFailed > 0
          ? { className: "border-destructive/30 bg-destructive/5" }
          : {})}
      />
      <StatChip
        label="Avg duration"
        count={metrics.averageDurationMs ? Math.round(metrics.averageDurationMs / 1000) : 0}
        className="border-border"
      />
      <div className="rounded-xl border border-border px-4 py-3">
        <p className="text-2xl font-bold tabular-nums">
          {metrics.totalCompleted > 0
            ? `${Math.round(
                (metrics.retryRate ?? 0) * 100,
              )}%`
            : "\u2014"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Retry rate</p>
      </div>
    </div>
  );
}

export function JobsStatusRow({ metrics }: { metrics: JobMetricsDto }) {
  const totalPending = getStatusCount(metrics, "PENDING");
  const totalProcessing = getStatusCount(metrics, "PROCESSING");
  const totalFailed = metrics.totalFailed;
  const totalCompleted = metrics.totalCompleted;

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
}
