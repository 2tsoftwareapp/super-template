"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";

import {
  fetchAuditSummary,
  fetchHealthStatus,
  fetchJobsSummary,
  fetchOverviewUsers,
} from "./dashboard-service";

export function useDashboardOverviewQueries() {
  return useQueries({
    queries: [
      {
        queryKey: ["admin-users-overview"],
        queryFn: fetchOverviewUsers,
        staleTime: 30_000,
      },
      {
        queryKey: ["admin-jobs-summary"],
        queryFn: fetchJobsSummary,
        staleTime: 15_000,
      },
      {
        queryKey: ["admin-audit-summary"],
        queryFn: fetchAuditSummary,
        staleTime: 15_000,
      },
      {
        queryKey: ["admin-health"],
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
    void queryClient.invalidateQueries({ queryKey: ["admin-users-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-jobs-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-audit-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-health"] });
  };
}
