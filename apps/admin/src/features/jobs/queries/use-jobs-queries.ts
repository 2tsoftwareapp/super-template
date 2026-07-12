"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchJobDetail,
  fetchJobLogs,
  fetchJobMetrics,
  fetchJobs,
  type JobsParams,
} from "../api/jobs-api";
import { JOB_DETAIL_BASE_QUERY_KEY, JOB_LOGS_BASE_QUERY_KEY, JOB_METRICS_BASE_QUERY_KEY, JOBS_BASE_QUERY_KEY } from "../jobs-query-keys";

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
