import type { JobMetricsDto } from "@/lib/api-types";

export function getStatusCount(metrics: JobMetricsDto, status: string): number {
  return metrics.byStatus?.find((bucket) => bucket.status === status)?.total ?? 0;
}

export function getActiveJobsCount(metrics: JobMetricsDto): number {
  return getStatusCount(metrics, "PROCESSING") + getStatusCount(metrics, "PENDING");
}

export function getFailedJobsCount(metrics: JobMetricsDto): number {
  return metrics.totalFailed ?? getStatusCount(metrics, "FAILED");
}

export function getCompletedJobsCount(metrics: JobMetricsDto): number {
  return metrics.totalCompleted ?? getStatusCount(metrics, "COMPLETED");
}

export function getTotalJobsCount(metrics: JobMetricsDto): number {
  if (Array.isArray(metrics.byStatus) && metrics.byStatus.length > 0) {
    return metrics.byStatus.reduce((acc, curr) => acc + (curr.total ?? 0), 0);
  }
  return (metrics.totalCompleted ?? 0) + (metrics.totalFailed ?? 0) + getActiveJobsCount(metrics);
}
