"use client";

import {
  useDashboardOverviewQueries,
  useRefreshDashboard,
} from "@/features/dashboard/use-dashboard-queries";
import { useSession } from "@/hooks/use-session";

type DashboardQueries = ReturnType<typeof useDashboardOverviewQueries>;
type RecentUser = NonNullable<DashboardQueries[0]["data"]>["data"][number];
type RecentActivityEntry = NonNullable<
  DashboardQueries[2]["data"]
>["data"][number];

export interface DashboardViewModel {
  isRefreshing: boolean;
  header: {
    userName: string;
    isHealthy: boolean;
    healthFetching: boolean;
    onRefresh: () => void;
  };
  failedJobsAlert: { show: boolean; failed: number };
  stats: {
    firstLoad: boolean;
    totalUsers: number;
    usersLoading: boolean;
    activeJobs: number;
    failedJobs: number;
    pendingJobs: number;
    jobsLoading: boolean;
    permissionCount: number;
    healthFetching: boolean;
    isHealthy: boolean;
  };
  activity: { isLoading: boolean; recentActivity: RecentActivityEntry[] };
  health: { isHealthy: boolean; failedJobs: number; pendingJobs: number };
  users: { isLoading: boolean; recentUsers: RecentUser[] };
}

/**
 * Orchestration hook for the dashboard overview: session, overview queries and
 * the derived job/health/user summary state. Returns a view model consumed by
 * the presentational dashboard overview.
 */
export function useDashboardController(): DashboardViewModel {
  const session = useSession();
  const refresh = useRefreshDashboard();
  const [users, jobs, auditLogs, health] = useDashboardOverviewQueries();

  const jobData = jobs.data?.data ?? [];
  const pending = jobData.filter((j) => j.status === "PENDING").length;
  const running = jobData.filter((j) => j.status === "PROCESSING").length;
  const failed = jobData.filter((j) => j.status === "FAILED").length;

  const isRefreshing =
    users.isFetching ||
    jobs.isFetching ||
    auditLogs.isFetching ||
    health.isFetching;

  const isHealthy = !health.isError && health.data?.data?.status === "ok";
  const activeJobs = pending + running;

  return {
    isRefreshing,
    header: {
      userName: session.data?.data.user.displayName ?? "Admin",
      isHealthy,
      healthFetching: health.isFetching,
      onRefresh: refresh,
    },
    failedJobsAlert: { show: !jobs.isLoading && failed > 0, failed },
    stats: {
      firstLoad: users.isLoading && jobs.isLoading,
      totalUsers: users.data?.meta?.total ?? users.data?.data.length ?? 0,
      usersLoading: users.isLoading,
      activeJobs,
      failedJobs: failed,
      pendingJobs: pending,
      jobsLoading: jobs.isLoading,
      permissionCount: session.data?.data.permissions.length ?? 0,
      healthFetching: health.isFetching,
      isHealthy,
    },
    activity: {
      isLoading: auditLogs.isLoading,
      recentActivity: auditLogs.data?.data ?? [],
    },
    health: { isHealthy, failedJobs: failed, pendingJobs: pending },
    users: { isLoading: users.isLoading, recentUsers: users.data?.data ?? [] },
  };
}
