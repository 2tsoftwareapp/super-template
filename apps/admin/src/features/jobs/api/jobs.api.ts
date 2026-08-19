import { bffPath } from "@repo/api-contract";

import type { JobDto, JobEventDto, JobMetricsDto, ListResponse } from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export interface JobsParams {
  status?: string | undefined;
  type?: string | undefined;
  page: number;
}

/**
 * Jobs transport layer. Paths from OpenAPI via `bffPath` (§22).
 */
export const jobsApi = {
  list(params: JobsParams) {
    const path = buildPath(bffPath("/api/v1/admin/jobs"), {
      limit: 50,
      page: params.page,
      status: params.status,
      type: params.type,
    });
    return webFetch<ListResponse<JobDto>>(path);
  },

  metrics() {
    return webFetch<{ data: JobMetricsDto }>(bffPath("/api/v1/admin/jobs/metrics"));
  },

  get(jobId: string) {
    return webFetch<{ data: JobDto }>(bffPath("/api/v1/admin/jobs/{id}", { id: jobId }));
  },

  logs(jobId: string) {
    return webFetch<{ data: JobEventDto[] }>(
      bffPath("/api/v1/admin/jobs/{id}/logs", { id: jobId }),
    );
  },

  cancel(jobId: string) {
    return webFetch<{ data: JobDto }>(bffPath("/api/v1/admin/jobs/{id}", { id: jobId }), {
      method: "DELETE",
    });
  },
};

/** @deprecated Prefer `jobsApi` */
export const fetchJobs = (params: JobsParams) => jobsApi.list(params);
export const fetchJobMetrics = () => jobsApi.metrics();
export const fetchJobDetail = (jobId: string) => jobsApi.get(jobId);
export const fetchJobLogs = (jobId: string) => jobsApi.logs(jobId);
export const cancelJob = (jobId: string) => jobsApi.cancel(jobId);
