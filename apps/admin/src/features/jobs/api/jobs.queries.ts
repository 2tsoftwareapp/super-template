"use client";

import { useQuery } from "@tanstack/react-query";

import { jobsApi, type JobsParams } from "./jobs.api";
import { jobsKeys } from "./jobs.query-keys";

export function useJobsQuery(params: JobsParams) {
  return useQuery({
    queryKey: jobsKeys.list({
      status: params.status,
      type: params.type,
      page: params.page,
      sortOrder: params.sortOrder,
    }),
    queryFn: () => jobsApi.list(params),
    placeholderData: (previous) => previous,
    staleTime: 0,
  });
}

export function useJobMetricsQuery() {
  return useQuery({
    queryKey: jobsKeys.metrics,
    queryFn: () => jobsApi.metrics(),
    staleTime: 0,
  });
}

export function useJobDetailQuery(jobId: string | undefined) {
  return useQuery({
    queryKey: jobsKeys.detail(jobId ?? ""),
    queryFn: () => jobsApi.get(jobId!),
    enabled: !!jobId,
    staleTime: 0,
  });
}

export function useJobLogsQuery(jobId: string | undefined) {
  return useQuery({
    queryKey: jobsKeys.logs(jobId ?? ""),
    queryFn: () => jobsApi.logs(jobId!),
    enabled: !!jobId,
    staleTime: 0,
  });
}
