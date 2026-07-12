"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";

import {
  fetchAuditSummary,
  fetchHealthStatus,
  fetchJobsSummary,
  fetchOverviewUsers,
} from "./api/dashboard-api";
import {
  DASHBOARD_AUDIT_QUERY_KEY,
  DASHBOARD_HEALTH_QUERY_KEY,
  DASHBOARD_JOBS_QUERY_KEY,
  DASHBOARD_USERS_QUERY_KEY,
} from "./model/dashboard-query-keys";

const DASHBOARD_QUERY_KEYS = [
  DASHBOARD_USERS_QUERY_KEY,
  DASHBOARD_JOBS_QUERY_KEY,
  DASHBOARD_AUDIT_QUERY_KEY,
  DASHBOARD_HEALTH_QUERY_KEY,
] as const;

export function useDashboardOverviewQueries() {
  return useQueries({
    queries: [
      {
        queryKey: [DASHBOARD_USERS_QUERY_KEY],
        queryFn: fetchOverviewUsers,
        staleTime: 30_000,
      },
      {
        queryKey: [DASHBOARD_JOBS_QUERY_KEY],
        queryFn: fetchJobsSummary,
        staleTime: 15_000,
      },
      {
        queryKey: [DASHBOARD_AUDIT_QUERY_KEY],
        queryFn: fetchAuditSummary,
        staleTime: 15_000,
      },
      {
        queryKey: [DASHBOARD_HEALTH_QUERY_KEY],
        queryFn: fetchHealthStatus,
        staleTime: 10_000,
        retry: 1,
      },
    ],
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of DASHBOARD_QUERY_KEYS) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}
