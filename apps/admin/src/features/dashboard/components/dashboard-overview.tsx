"use client";

import { Show } from "@repo/web-core/components/show";
import { AlertTriangle } from "lucide-react";

import type { DashboardViewModel } from "@/features/dashboard/use-dashboard-controller";

import { Link } from "@/i18n/navigation";

import { DashboardActivity } from "./dashboard-activity";
import { DashboardHeader } from "./dashboard-header";
import { DashboardHealth } from "./dashboard-health";
import { DashboardQuickLinks } from "./dashboard-quick-links";
import { DashboardStats } from "./dashboard-stats";
import { DashboardUsers } from "./dashboard-users";

/**
 * Presentational dashboard overview. Receives a fully-resolved view model from
 * the dashboard controller and composes the overview sub-components; it owns no
 * server state, session, or query orchestration.
 */
export function DashboardOverview({
  isRefreshing,
  header,
  failedJobsAlert,
  stats,
  activity,
  health,
  users,
}: DashboardViewModel) {
  return (
    <div className="flex h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7rem)] flex-col gap-3 overflow-hidden">
      <DashboardHeader
        userName={header.userName}
        isHealthy={header.isHealthy}
        healthFetching={header.healthFetching}
        isRefreshing={isRefreshing}
        onRefresh={header.onRefresh}
      />

      <Show when={failedJobsAlert.show}>
        <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-accent px-2.5 py-1.5 text-xs">
          <AlertTriangle className="size-3.5 shrink-0 text-accent-foreground" />
          <span className="text-foreground">
            <strong>
              {failedJobsAlert.failed} failed job
              {failedJobsAlert.failed > 1 ? "s" : ""}
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
        firstLoad={stats.firstLoad}
        totalUsers={stats.totalUsers}
        usersLoading={stats.usersLoading}
        activeJobs={stats.activeJobs}
        failedJobs={stats.failedJobs}
        pendingJobs={stats.pendingJobs}
        jobsLoading={stats.jobsLoading}
        permissionCount={stats.permissionCount}
        healthFetching={stats.healthFetching}
        isHealthy={stats.isHealthy}
      />

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1fr)_240px]">
        <DashboardActivity
          isLoading={activity.isLoading}
          recentActivity={activity.recentActivity}
        />

        <div className="flex min-h-0 flex-col gap-2">
          <DashboardHealth
            isHealthy={health.isHealthy}
            failedJobs={health.failedJobs}
            pendingJobs={health.pendingJobs}
          />

          <DashboardUsers
            isLoading={users.isLoading}
            recentUsers={users.recentUsers}
          />
        </div>
      </div>

      <DashboardQuickLinks />
    </div>
  );
}
