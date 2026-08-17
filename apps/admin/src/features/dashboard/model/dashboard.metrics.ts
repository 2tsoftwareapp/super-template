import type { JobMetricsDto } from "@/lib/api-types";

/** Derive dashboard job counters from server-side metrics (not a page of jobs). */
export function summarizeJobMetrics(metrics: JobMetricsDto | null | undefined) {
  const byStatus = metrics?.byStatus ?? [];
  const count = (status: string) => byStatus.find((bucket) => bucket.status === status)?.total ?? 0;

  const pending = count("PENDING");
  const processing = count("PROCESSING");
  const failed = metrics?.totalFailed ?? count("FAILED");

  return {
    pending,
    processing,
    failed,
    active: pending + processing,
  };
}
