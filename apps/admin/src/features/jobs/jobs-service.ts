import type {
  JobDto,
  JobEventDto,
  JobMetricsDto,
  ListResponse,
} from "@/lib/api-types";

import { buildPath, webFetch } from "@/lib/http";

export interface JobsParams {
  status?: string | undefined;
  type?: string | undefined;
  page: number;
}

export async function fetchJobs(params: JobsParams) {
  const path = buildPath("/api/bff/admin/jobs", {
    limit: 50,
    page: params.page,
    status: params.status,
    type: params.type,
  });
  return webFetch<ListResponse<JobDto>>(path);
}

export async function fetchJobMetrics() {
  return webFetch<{ data: JobMetricsDto }>("/api/bff/admin/jobs/metrics");
}

export async function fetchJobDetail(jobId: string) {
  return webFetch<{ data: JobDto }>(`/api/bff/admin/jobs/${jobId}`);
}

export async function fetchJobLogs(jobId: string) {
  return webFetch<{ data: JobEventDto[] }>(
    `/api/bff/admin/jobs/${jobId}/logs`,
  );
}

export async function cancelJob(jobId: string) {
  return webFetch<JobDto>(`/api/bff/admin/jobs/${jobId}`, {
    method: "DELETE",
  });
}
