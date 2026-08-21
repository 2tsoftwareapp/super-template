"use client";

import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";
import { AlertTriangle } from "lucide-react";

import type { DashboardViewModel } from "@/features/dashboard/model/dashboard.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { Link } from "@/i18n/navigation";
import { adminResources } from "@/lib/admin-resources";
import { cn } from "@/lib/utils";

import { DashboardActivity } from "./dashboard-activity";
import { DashboardHealth } from "./dashboard-health";
import { DashboardQuickLinks } from "./dashboard-quick-links";
import { DashboardStats } from "./dashboard-stats";
import { DashboardUsers } from "./dashboard-users";

const dashboardResource = adminResources.find((r) => r.id === "dashboard")!;

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
    <ResourcePageShell
      resource={dashboardResource}
      description={`Welcome back, ${header.userName}`}
      isRefreshing={isRefreshing}
      onRefresh={header.onRefresh}
      meta={
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium",
            header.healthFetching
              ? "border-border"
              : header.isHealthy
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
        >
          {header.healthFetching ? (
            <Spinner className="size-2" />
          ) : (
            <span
              className={cn(
                "size-1.5 rounded-full",
                header.isHealthy ? "bg-primary" : "bg-destructive",
              )}
            />
          )}
          {header.healthFetching ? "Checking" : header.isHealthy ? "Healthy" : "Degraded"}
        </span>
      }
    >
      <div className="flex h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7rem)] flex-col gap-4 overflow-hidden">
        <Show when={failedJobsAlert.show}>
          <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-accent px-2.5 py-1.5 text-xs">
            <AlertTriangle className="size-3.5 shrink-0 text-accent-foreground" />
            <span className="text-foreground">
              <strong>
                {failedJobsAlert.failed} failed job
                {failedJobsAlert.failed > 1 ? "s" : ""}
              </strong>
              {" · "}
              <Link href="/jobs" className="underline underline-offset-2 hover:no-underline">
                Review
              </Link>
            </span>
          </div>
        </Show>

        <DashboardStats
          firstLoad={stats.firstLoad}
          totalUsers={stats.totalUsers}
          usersLoading={stats.usersLoading}
          usersError={stats.usersError}
          onRetryUsers={stats.onRetryUsers}
          activeJobs={stats.activeJobs}
          failedJobs={stats.failedJobs}
          pendingJobs={stats.pendingJobs}
          jobsLoading={stats.jobsLoading}
          jobsError={stats.jobsError}
          onRetryJobs={stats.onRetryJobs}
          permissionCount={stats.permissionCount}
          healthFetching={stats.healthFetching}
          isHealthy={stats.isHealthy}
        />

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <DashboardActivity
            isLoading={activity.isLoading}
            isError={activity.isError}
            onRetry={activity.onRetry}
            recentActivity={activity.recentActivity}
          />

          <div className="flex min-h-0 flex-col gap-3">
            <DashboardHealth
              apiHealthy={health.apiHealthy}
              dbHealthy={health.dbHealthy}
              failedJobs={health.failedJobs}
              pendingJobs={health.pendingJobs}
            />

            <DashboardUsers
              isLoading={users.isLoading}
              isError={users.isError}
              onRetry={users.onRetry}
              recentUsers={users.recentUsers}
            />
          </div>
        </div>

        <DashboardQuickLinks />
      </div>
    </ResourcePageShell>
  );
}
