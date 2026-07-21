"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";

import { dashboardApi } from "./dashboard.api";
import { dashboardKeys } from "./dashboard.query-keys";

const DASHBOARD_QUERY_KEYS = [
  dashboardKeys.users,
  dashboardKeys.jobs,
  dashboardKeys.audit,
  dashboardKeys.health,
  dashboardKeys.healthReady,
] as const;

export function useDashboardOverviewQueries() {
  return useQueries({
    queries: [
      {
        queryKey: dashboardKeys.users,
        queryFn: () => dashboardApi.overviewUsers(),
        staleTime: 30_000,
      },
      {
        queryKey: dashboardKeys.jobs,
        queryFn: () => dashboardApi.jobMetrics(),
        staleTime: 15_000,
      },
      {
        queryKey: dashboardKeys.audit,
        queryFn: () => dashboardApi.auditSummary(),
        staleTime: 15_000,
      },
      {
        queryKey: dashboardKeys.health,
        queryFn: () => dashboardApi.health(),
        staleTime: 10_000,
        retry: 1,
      },
      {
        queryKey: dashboardKeys.healthReady,
        queryFn: () => dashboardApi.healthReady(),
        staleTime: 10_000,
        retry: 1,
      },
    ],
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  return () => {
    for (const queryKey of DASHBOARD_QUERY_KEYS) {
      void queryClient.invalidateQueries({ queryKey });
    }
  };
}
