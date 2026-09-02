import { Badge } from "@repo/web-ui/badge";
import { Card, CardContent } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { Activity, ArrowUpRight, CheckCircle2, ShieldCheck, Users, Workflow } from "lucide-react";
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {usersError ? (
        <StatErrorCard label="Users" onRetry={onRetryUsers} />
      ) : (
        <StatCard
          label="Total Users"
          value={totalUsers.toLocaleString()}
          badge="Workspace"
          badgeVariant="secondary"
          sub="Registered accounts & profiles"
          icon={<Users className="size-4 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          href="/users"
          loading={usersLoading}
        />
      )}

      {jobsError ? (
        <StatErrorCard label="Jobs" onRetry={onRetryJobs} />
      ) : (
        <StatCard
          label="Background Jobs"
          value={activeJobs}
          badge={failedJobs > 0 ? `${failedJobs} failed` : "Active"}
          badgeVariant={failedJobs > 0 ? "destructive" : "secondary"}
          sub={
            failedJobs > 0
              ? `${failedJobs} failed · ${pendingJobs} in queue`
              : `${pendingJobs} pending tasks in queue`
          }
          icon={
            <Workflow
              className={cn(
                "size-4",
                failedJobs > 0 ? "text-destructive" : "text-violet-600 dark:text-violet-400",
              )}
            />
          }
          iconBg={cn(
            "border",
            failedJobs > 0
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
          )}
          href="/jobs"
          loading={jobsLoading}
        />
      )}

      <StatCard
        label="Permissions"
        value={permissionCount}
        badge="Active Role"
        badgeVariant="outline"
        sub="Assigned security permissions"
        icon={<ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />}
        iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
        href="/roles"
      />

      <StatCard
        label="System Health"
        value={healthFetching ? "…" : isHealthy ? "Operational" : "Degraded"}
        badge={healthFetching ? "Checking" : isHealthy ? "100% OK" : "Issues"}
        badgeVariant={isHealthy ? "default" : "destructive"}
        sub={healthFetching ? "Verifying connectivity..." : "All services communicating"}
        icon={
          <Activity
            className={cn(
              "size-4",
              isHealthy ? "text-primary" : "text-destructive",
            )}
          />
        }
        iconBg={cn(
          "border",
          isHealthy
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-destructive/10 text-destructive border-destructive/20",
        )}
        loading={healthFetching}
      />
    </div>
  );
}

function StatErrorCard({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <Card className="rounded-xl border border-border shadow-xs">
      <CardContent className="p-4">
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
    <Card className="rounded-xl border border-border shadow-xs">
      <CardContent className="p-4.5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
          <div className="size-8 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2.5 h-3 w-32 animate-pulse rounded-full bg-muted" />
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  sub,
  badge,
  badgeVariant = "secondary",
  icon,
  iconBg,
  loading,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  icon: ReactNode;
  iconBg: string;
  loading?: boolean;
  href?: string;
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/80 bg-card p-4.5 transition-all duration-200 shadow-xs hover:border-border hover:shadow-sm",
        href && "hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          {badge ? (
            <Badge variant={badgeVariant} className="px-1.5 py-0 text-[10px] font-medium">
              {badge}
            </Badge>
          ) : null}
          <div className={cn("flex size-7.5 items-center justify-center rounded-lg transition-transform group-hover:scale-105", iconBg)}>
            {icon}
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        {loading ? (
          <div className="h-7.5 w-20 animate-pulse rounded-lg bg-muted" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        )}
        {sub ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
            {sub}
          </p>
        ) : null}
      </div>

      {href ? (
        <div className="absolute right-3.5 bottom-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <ArrowUpRight className="size-3.5 text-muted-foreground" />
        </div>
      ) : null}

      {href ? (
        <Link href={href} className="absolute inset-0 rounded-xl">
          <span className="sr-only">View {label}</span>
        </Link>
      ) : null}
    </Card>
  );
}
