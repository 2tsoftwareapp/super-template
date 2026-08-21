import { Card, CardContent } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { Activity, ShieldCheck, Users, Workflow } from "lucide-react";
import { type ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
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
}

export function DashboardStats({
  firstLoad,
  totalUsers,
  usersLoading,
  usersError,
  onRetryUsers,
  activeJobs,
  failedJobs,
  pendingJobs,
  jobsLoading,
  jobsError,
  onRetryJobs,
  permissionCount,
  healthFetching,
  isHealthy,
}: DashboardStatsProps) {
  if (firstLoad) {
    return (
      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
    );
  }

  return (
    <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {usersError ? (
        <StatErrorCard label="Users" onRetry={onRetryUsers} />
      ) : (
        <MiniStat
          label="Users"
          value={totalUsers}
          sub="Registered"
          icon={<Users className="size-4 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          href="/users"
          loading={usersLoading}
        />
      )}
      {jobsError ? (
        <StatErrorCard label="Jobs" onRetry={onRetryJobs} />
      ) : (
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
                "size-4",
                failedJobs > 0 ? "text-destructive" : "text-violet-600 dark:text-violet-400",
              )}
            />
          }
          iconBg={failedJobs > 0 ? "bg-destructive/10" : "bg-violet-50 dark:bg-violet-500/10"}
          href="/jobs"
          loading={jobsLoading}
        />
      )}
      <MiniStat
        label="Permissions"
        value={permissionCount}
        sub="Your role"
        icon={<ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />}
        iconBg="bg-amber-50 dark:bg-amber-500/10"
      />
      <MiniStat
        label="API"
        value={healthFetching ? "…" : isHealthy ? "OK" : "Down"}
        sub={healthFetching ? "Checking" : "Health check"}
        icon={
          <Activity className={cn("size-4", isHealthy ? "text-primary" : "text-destructive")} />
        }
        iconBg={isHealthy ? "bg-primary/10" : "bg-destructive/10"}
        loading={healthFetching}
      />
    </div>
  );
}

function StatErrorCard({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <Card size="sm">
      <CardContent className="py-3">
        <ErrorState
          variant="inline"
          className="m-0"
          title={`Could not load ${label.toLowerCase()}.`}
          action={{ label: "Retry", onClick: onRetry }}
        />
      </CardContent>
    </Card>
  );
}

function SkeletonStat() {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-4 py-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-2.5 w-14 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-2 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="size-10 shrink-0 animate-pulse rounded-xl bg-muted" />
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
  const card = (
    <Card size="sm" hoverable={!!href} className="relative">
      <CardContent className="flex items-center gap-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </p>
          {loading ? (
            <div className="mt-1.5 h-6 w-12 animate-pulse rounded-lg bg-muted" />
          ) : (
            <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums leading-none text-foreground">
              {value}
            </p>
          )}
          {sub ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{sub}</p> : null}
        </div>
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconBg)}>
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

  return card;
}
