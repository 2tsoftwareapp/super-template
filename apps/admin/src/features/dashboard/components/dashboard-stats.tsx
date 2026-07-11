import { Card, CardContent } from "@repo/web-core/components/card";
import { Activity, ShieldCheck, Users, Workflow } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DashboardStatsProps {
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
}

export function DashboardStats({
  firstLoad,
  totalUsers,
  usersLoading,
  activeJobs,
  failedJobs,
  pendingJobs,
  jobsLoading,
  permissionCount,
  healthFetching,
  isHealthy,
}: DashboardStatsProps) {
  if (firstLoad) {
    return (
      <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
    );
  }

  return (
    <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <MiniStat
        label="Users"
        value={totalUsers}
        sub="Registered"
        icon={<Users className="size-3.5 text-chart-2" />}
        iconBg="bg-muted"
        href="/users"
        loading={usersLoading}
      />
      <MiniStat
        label="Jobs"
        value={activeJobs}
        sub={
          failedJobs > 0
            ? `${failedJobs} failed · ${pendingJobs} pending`
            : `${pendingJobs} pending`
        }
        icon={
          <Workflow
            className={cn(
              "size-3.5",
              failedJobs > 0 ? "text-destructive" : "text-chart-5",
            )}
          />
        }
        iconBg={failedJobs > 0 ? "bg-destructive/10" : "bg-accent"}
        href="/jobs"
        loading={jobsLoading}
      />
      <MiniStat
        label="Permissions"
        value={permissionCount}
        sub="Your role"
        icon={
          <ShieldCheck className="size-3.5 text-secondary-foreground" />
        }
        iconBg="bg-muted"
      />
      <MiniStat
        label="API"
        value={healthFetching ? "…" : isHealthy ? "OK" : "Down"}
        sub={healthFetching ? "Checking" : "Health check"}
        icon={
          <Activity
            className={cn(
              "size-3.5",
              isHealthy ? "text-primary" : "text-destructive",
            )}
          />
        }
        iconBg={isHealthy ? "bg-primary/10" : "bg-destructive/10"}
        loading={healthFetching}
      />
    </div>
  );
}

function SkeletonStat() {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-2 py-0">
        <div className="min-w-0 space-y-1">
          <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
          <div className="h-5 w-10 animate-pulse rounded bg-muted" />
        </div>
        <div className="size-7 shrink-0 animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  sub,
  icon,
  iconBg,
  loading,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  iconBg: string;
  loading?: boolean;
  href?: string;
}) {
  return (
    <Card size="sm" className="relative">
      <CardContent className="flex items-center justify-between gap-2 py-0">
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          {loading ? (
            <div className="mt-1 h-5 w-10 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-lg font-semibold tracking-tight tabular-nums leading-tight">
              {value}
            </p>
          )}
          {sub ? (
            <p className="truncate text-[10px] text-muted-foreground">
              {sub}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            iconBg,
          )}
        >
          {icon}
        </div>
      </CardContent>
      {href ? (
        <Link href={href} className="absolute inset-0 rounded-xl">
          <span className="sr-only">View {label}</span>
        </Link>
      ) : null}
    </Card>
  );
}
