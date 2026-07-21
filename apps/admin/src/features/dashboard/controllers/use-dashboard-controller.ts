"use client";

import { useQueryClient } from "@tanstack/react-query";

import type { DashboardViewModel } from "@/features/dashboard/model/dashboard.types";

import {
  useDashboardOverviewQueries,
  useRefreshDashboard,
} from "@/features/dashboard/api/dashboard.queries";
import { dashboardKeys } from "@/features/dashboard/api/dashboard.query-keys";
import { summarizeJobMetrics } from "@/features/dashboard/model/dashboard.metrics";
import { useSession } from "@/hooks/use-session";

export type { DashboardViewModel };

/**
 * Orchestration hook for the dashboard overview: session, overview queries and
 * the derived job/health/user summary state. Returns a view model consumed by
 * the presentational dashboard overview.
 */
export function useDashboardController(): DashboardViewModel {
  const session = useSession();
  const refresh = useRefreshDashboard();
  const queryClient = useQueryClient();
  const [users, jobs, auditLogs, health, healthReady] =
    useDashboardOverviewQueries();

  const jobSummary = summarizeJobMetrics(jobs.data?.data);
  const { pending, failed, active: activeJobs } = jobSummary;

  const isRefreshing =
    users.isFetching ||
    jobs.isFetching ||
    auditLogs.isFetching ||
    health.isFetching ||
    healthReady.isFetching;

  const apiHealthy = !health.isError && health.data?.data?.status === "ok";
  const dbHealthy =
    !healthReady.isError && healthReady.data?.data?.status === "ready";
  const isHealthy = apiHealthy && dbHealthy;

  const retryUsers = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.users });
  };
  const retryJobs = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.jobs });
  };
  const retryActivity = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.audit });
  };

  return {
    isRefreshing,
    header: {
      userName: session.data?.data.user.displayName ?? "Admin",
      isHealthy,
      healthFetching: health.isFetching || healthReady.isFetching,
      onRefresh: refresh,
    },
    failedJobsAlert: { show: !jobs.isLoading && !jobs.isError && failed > 0, failed },
    stats: {
      firstLoad: users.isLoading && jobs.isLoading,
      totalUsers: users.data?.meta?.total ?? users.data?.data.length ?? 0,
      usersLoading: users.isLoading,
      usersError: users.isError,
      onRetryUsers: retryUsers,
      activeJobs,
      failedJobs: failed,
      pendingJobs: pending,
      jobsLoading: jobs.isLoading,
      jobsError: jobs.isError,
      onRetryJobs: retryJobs,
      permissionCount: session.data?.data.permissions.length ?? 0,
      healthFetching: health.isFetching || healthReady.isFetching,
      isHealthy,
    },
    activity: {
      isLoading: auditLogs.isLoading,
      isError: auditLogs.isError,
      onRetry: retryActivity,
      recentActivity: auditLogs.data?.data ?? [],
    },
    health: {
      apiHealthy,
      dbHealthy,
      failedJobs: failed,
      pendingJobs: pending,
    },
    users: {
      isLoading: users.isLoading,
      isError: users.isError,
      onRetry: retryUsers,
      recentUsers: users.data?.data ?? [],
    },
  };
}
