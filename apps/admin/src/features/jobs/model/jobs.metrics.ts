import type { JobMetricsDto } from "@/lib/api-types";

export function getStatusCount(metrics: JobMetricsDto, status: string): number {
  return metrics.byStatus?.find((bucket) => bucket.status === status)?.total ?? 0;
}
