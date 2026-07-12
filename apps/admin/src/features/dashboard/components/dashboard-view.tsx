"use client";

import { Show } from "@repo/web-core/components/show";
import { AlertTriangle } from "lucide-react";

import {
  useDashboardOverviewQueries,
  useRefreshDashboard,
} from "@/features/dashboard/use-dashboard-queries";
import { useSession } from "@/hooks/use-session";
import { Link } from "@/i18n/navigation";

import { DashboardActivity } from "./dashboard-activity";
import { DashboardHeader } from "./dashboard-header";
import { DashboardHealth } from "./dashboard-health";
import { DashboardQuickLinks } from "./dashboard-quick-links";
import { DashboardStats } from "./dashboard-stats";
import { DashboardUsers } from "./dashboard-users";

export function DashboardView() {
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

  const userName = session.data?.data.user.displayName ?? "Admin";
  const permissionCount = session.data?.data.permissions.length ?? 0;
  const totalUsers = users.data?.meta?.total ?? users.data?.data.length ?? 0;
  const isHealthy = !health.isError && health.data?.data?.status === "ok";
  const activeJobs = pending + running;
  const firstLoad = users.isLoading && jobs.isLoading;
  const recentUsers = users.data?.data ?? [];
  const recentActivity = auditLogs.data?.data ?? [];

  if (isRefreshing) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <p className="text-xs text-muted-foreground">
            Refreshing dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7rem)] flex-col gap-3 overflow-hidden">
      <DashboardHeader
        userName={userName}
        isHealthy={isHealthy}
        healthFetching={health.isFetching}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
      />

      <Show when={!jobs.isLoading && failed > 0}>
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-accent px-2.5 py-1.5 text-xs">
          <AlertTriangle className="size-3.5 shrink-0 text-accent-foreground" />
          <span className="text-foreground">
            <strong>
              {failed} failed job{failed > 1 ? "s" : ""}
            </strong>
            {" · "}
            <Link
              href="/jobs"
              className="underline underline-offset-2 hover:no-underline"
            >
              Review
            </Link>
          </span>
        </div>
      </Show>

      <DashboardStats
        firstLoad={firstLoad}
        totalUsers={totalUsers}
        usersLoading={users.isLoading}
        activeJobs={activeJobs}
        failedJobs={failed}
        pendingJobs={pending}
        jobsLoading={jobs.isLoading}
        permissionCount={permissionCount}
        healthFetching={health.isFetching}
        isHealthy={isHealthy}
      />

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1fr)_240px]">
        <DashboardActivity
          isLoading={auditLogs.isLoading}
          recentActivity={recentActivity}
        />

        <div className="flex min-h-0 flex-col gap-2">
          <DashboardHealth
            isHealthy={isHealthy}
            failedJobs={failed}
            pendingJobs={pending}
          />

          <DashboardUsers
            isLoading={users.isLoading}
            recentUsers={recentUsers}
          />
        </div>
      </div>

      <DashboardQuickLinks />
    </div>
  );
}
