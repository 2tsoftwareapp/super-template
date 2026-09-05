"use client";

import { Button } from "@repo/web-ui/button";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";
import { AlertTriangle, ArrowRight } from "lucide-react";

import type { DashboardViewModel } from "@/features/dashboard/model/dashboard.types";

import { ResourcePageShell } from "@/components/resource-page-shell";
import { adminResources } from "@/features/_plugin-resources/admin-resources";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { DashboardActivity } from "./dashboard-activity";
import { DashboardHealth } from "./dashboard-health";
import { DashboardQuickLinks } from "./dashboard-quick-links";
import { DashboardStats } from "./dashboard-stats";
import { DashboardUsers } from "./dashboard-users";

const dashboardResource = adminResources.find((r) => r.id === "dashboard")!;

/**
 * Presentational dashboard overview.
 * Renders a responsive, clean, and modern administration dashboard
 * with natural page scrolling, KPI statistics, activity timelines,
 * infrastructure health, user rosters, and quick action shortcuts.
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
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors",
              header.isHealthy
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {header.healthFetching ? (
              <Spinner className="size-3 text-muted-foreground" />
            ) : (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  header.isHealthy ? "bg-emerald-500 animate-pulse" : "bg-destructive",
                )}
              />
            )}
            {header.healthFetching
              ? "Checking status..."
              : header.isHealthy
                ? "System Healthy"
                : "System Degraded"}
          </span>
        </div>
      }
    >
      <div className="space-y-6 pb-12">
        {/* Urgent Alerts (e.g. Failed background jobs) */}
        <Show when={failedJobsAlert.show}>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-4.5 shrink-0 text-destructive" />
              <div>
                <span className="font-semibold">
                  {failedJobsAlert.failed} background job{failedJobsAlert.failed > 1 ? "s" : ""}{" "}
                  failed
                </span>
                <span className="hidden text-xs text-destructive/80 sm:inline ml-2">
                  Some background operations require attention or retry.
                </span>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="h-7.5 gap-1 px-3 text-xs font-medium"
              asChild
            >
              <Link href="/jobs">
                Review jobs
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
        </Show>

        {/* Top KPI Statistics Grid */}
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

        {/* Primary Content Split: 2/3 Feed & Shortcuts + 1/3 Health & Users */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main 2-Column Section */}
          <div className="space-y-6 lg:col-span-2">
            <DashboardActivity
              isLoading={activity.isLoading}
              isError={activity.isError}
              onRetry={activity.onRetry}
              recentActivity={activity.recentActivity}
            />

            <DashboardQuickLinks />
          </div>

          {/* Right 1-Column Section */}
          <div className="space-y-6 lg:col-span-1">
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
      </div>
    </ResourcePageShell>
  );
}
