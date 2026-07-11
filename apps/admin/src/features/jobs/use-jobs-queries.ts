"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchJobDetail,
  fetchJobLogs,
  fetchJobMetrics,
  fetchJobs,
  type JobsParams,
} from "./jobs-service";

export const JOBS_BASE_QUERY_KEY = "admin-jobs" as const;
export const JOB_METRICS_BASE_QUERY_KEY = "admin-jobs-metrics" as const;
export const JOB_DETAIL_BASE_QUERY_KEY = "admin-job-detail" as const;
export const JOB_LOGS_BASE_QUERY_KEY = "admin-job-logs" as const;

export function useJobsQuery(params: JobsParams) {
  return useQuery({
    queryKey: [
      JOBS_BASE_QUERY_KEY,
      params.status,
      params.type,
      params.page,
    ],
    queryFn: () => fetchJobs(params),
  });
}

export function useJobMetricsQuery() {
  return useQuery({
    queryKey: [JOB_METRICS_BASE_QUERY_KEY],
    queryFn: fetchJobMetrics,
  });
}

export function useJobDetailQuery(jobId: string | undefined) {
  return useQuery({
    queryKey: [JOB_DETAIL_BASE_QUERY_KEY, jobId],
    queryFn: () => fetchJobDetail(jobId!),
    enabled: !!jobId,
  });
}

export function useJobLogsQuery(jobId: string | undefined) {
  return useQuery({
    queryKey: [JOB_LOGS_BASE_QUERY_KEY, jobId],
    queryFn: () => fetchJobLogs(jobId!),
    enabled: !!jobId,
  });
}
