import type { AuditLogDto, UserRow } from "@/lib/api-types";

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
    usersError: boolean;
    onRetryUsers: () => void;
    activeJobs: number;
    failedJobs: number;
    pendingJobs: number;
    jobsLoading: boolean;
    jobsError: boolean;
    onRetryJobs: () => void;
    permissionCount: number;
    healthFetching: boolean;
    isHealthy: boolean;
  };
  activity: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    recentActivity: AuditLogDto[];
  };
  health: {
    apiHealthy: boolean;
    dbHealthy: boolean;
    failedJobs: number;
    pendingJobs: number;
  };
  users: {
    isLoading: boolean;
    isError: boolean;
    onRetry: () => void;
    recentUsers: UserRow[];
  };
}
