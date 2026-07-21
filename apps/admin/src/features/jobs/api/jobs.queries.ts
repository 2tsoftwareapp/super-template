"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchJobDetail,
  fetchJobLogs,
  fetchJobMetrics,
  fetchJobs,
  type JobsParams,
} from "./jobs.api";
import { jobsKeys } from "./jobs.query-keys";

export function useJobsQuery(params: JobsParams) {
  return useQuery({
    queryKey: jobsKeys.list({ status: params.status, type: params.type, page: params.page }),
    queryFn: () => fetchJobs(params),
    placeholderData: (previous) => previous,
  });
}

export function useJobMetricsQuery() {
  return useQuery({
    queryKey: jobsKeys.metrics,
    queryFn: fetchJobMetrics,
  });
}

export function useJobDetailQuery(jobId: string | undefined) {
  return useQuery({
    queryKey: jobsKeys.detail(jobId ?? ""),
    queryFn: () => fetchJobDetail(jobId!),
    enabled: !!jobId,
  });
}

export function useJobLogsQuery(jobId: string | undefined) {
  return useQuery({
    queryKey: jobsKeys.logs(jobId ?? ""),
    queryFn: () => fetchJobLogs(jobId!),
    enabled: !!jobId,
  });
}
