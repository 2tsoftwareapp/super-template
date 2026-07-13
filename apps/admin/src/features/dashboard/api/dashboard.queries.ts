"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";

import {
  fetchAuditSummary,
  fetchHealthStatus,
  fetchJobsSummary,
  fetchOverviewUsers,
} from "./dashboard.api";
import { dashboardKeys } from "./dashboard.query-keys";

const DASHBOARD_QUERY_KEYS = [
  ...dashboardKeys.users,
  ...dashboardKeys.jobs,
  ...dashboardKeys.audit,
  ...dashboardKeys.health,
] as const;

export function useDashboardOverviewQueries() {
  return useQueries({
    queries: [
      {
        queryKey: dashboardKeys.users,
        queryFn: fetchOverviewUsers,
        staleTime: 30_000,
      },
      {
        queryKey: dashboardKeys.jobs,
        queryFn: fetchJobsSummary,
        staleTime: 15_000,
      },
      {
        queryKey: dashboardKeys.audit,
        queryFn: fetchAuditSummary,
        staleTime: 15_000,
      },
      {
        queryKey: dashboardKeys.health,
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
