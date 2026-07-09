"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  LogIn,
  Mail,
  Megaphone,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import type {
  AuditLogDto,
  JobDto,
  ListResponse,
  UserRow,
} from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, " · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  const s = status.toLowerCase();
  if (s === "active" || s === "completed") return "default";
  if (s === "pending" || s === "processing" || s === "running") return "secondary";
  return "outline";
}

function auditIcon(action: string) {
  if (action.startsWith("user"))
    return { icon: <Users className="size-3" />, c: "text-chart-2" };
  if (action.startsWith("auth") || action.startsWith("login"))
    return { icon: <LogIn className="size-3" />, c: "text-primary" };
  if (action.startsWith("job"))
    return { icon: <Workflow className="size-3" />, c: "text-chart-5" };
  if (action.startsWith("mail"))
    return { icon: <Mail className="size-3" />, c: "text-chart-3" };
  return { icon: <Activity className="size-3" />, c: "text-muted-foreground" };
}

const QUICK_ACTIONS = [
  { href: "/users", label: "Users", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Workflow },
  { href: "/mail", label: "Mail", icon: Mail },
  { href: "/notifications", label: "Notify", icon: Megaphone },
  { href: "/audit-logs", label: "Audit", icon: Shield },
] as const;

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
            <p className="truncate text-[10px] text-muted-foreground">{sub}</p>
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

export function DashboardView() {
  const session = useSession();
  const queryClient = useQueryClient();

  const [users, jobs, auditLogs, health] = useQueries({
    queries: [
      {
        queryKey: ["admin-users-overview"],
        queryFn: () => webFetch<ListResponse<UserRow>>("/api/bff/admin/users?limit=4"),
        staleTime: 30_000,
      },
      {
        queryKey: ["admin-jobs-summary"],
        queryFn: () => webFetch<ListResponse<JobDto>>("/api/bff/admin/jobs?limit=100"),
        staleTime: 15_000,
      },
      {
        queryKey: ["admin-audit-summary"],
        queryFn: () => webFetch<ListResponse<AuditLogDto>>("/api/bff/admin/audit-logs?limit=5"),
        staleTime: 15_000,
      },
      {
        queryKey: ["admin-health"],
        queryFn: () => webFetch<{ data: { status: string } }>("/api/bff/health"),
        staleTime: 10_000,
        retry: 1,
      },
    ],
  });

  const jobData = jobs.data?.data ?? [];
  const pending = jobData.filter((j) => j.status === "PENDING").length;
  const running = jobData.filter((j) => j.status === "PROCESSING").length;
  const failed = jobData.filter((j) => j.status === "FAILED").length;

  const isRefreshing =
    users.isFetching || jobs.isFetching || auditLogs.isFetching || health.isFetching;

  if (session.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  const userName = session.data?.data.user.displayName ?? "Admin";
  const permissionCount = session.data?.data.permissions.length ?? 0;
  const totalUsers = users.data?.meta?.total ?? users.data?.data.length ?? 0;
  const isHealthy = !health.isError && health.data?.data?.status === "ok";
  const activeJobs = pending + running;
  const firstLoad = users.isLoading && jobs.isLoading;
  const recentUsers = users.data?.data ?? [];
  const recentActivity = auditLogs.data?.data ?? [];

  return (
    <div className="flex h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7rem)] flex-col gap-3 overflow-hidden">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="truncate text-sm text-muted-foreground">
          Welcome back,{" "}
          <span className="font-medium text-foreground">{userName}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium",
              health.isFetching
                ? "border-border"
                : isHealthy
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-destructive/30 bg-destructive/5 text-destructive",
            )}
          >
            {health.isFetching ? (
              <Spinner className="size-2" />
            ) : (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isHealthy ? "bg-primary" : "bg-destructive",
                )}
              />
            )}
            {health.isFetching ? "Checking" : isHealthy ? "Healthy" : "Degraded"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => void queryClient.invalidateQueries()}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("size-3", isRefreshing && "animate-spin")} />
            <span className="sr-only md:not-sr-only md:ml-1.5">
              {isRefreshing ? "Refreshing" : "Refresh"}
            </span>
          </Button>
        </div>
      </div>

      {!jobs.isLoading && failed > 0 ? (
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
      ) : null}

      {/* KPI row */}
      {firstLoad ? (
        <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      ) : (
        <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat
            label="Users"
            value={totalUsers}
            sub="Registered"
            icon={<Users className="size-3.5 text-chart-2" />}
            iconBg="bg-muted"
            href="/users"
            loading={users.isLoading}
          />
          <MiniStat
            label="Jobs"
            value={activeJobs}
            sub={
              failed > 0
                ? `${failed} failed · ${pending} pending`
                : `${pending} pending`
            }
            icon={
              <Workflow
                className={cn(
                  "size-3.5",
                  failed > 0 ? "text-destructive" : "text-chart-5",
                )}
              />
            }
            iconBg={failed > 0 ? "bg-destructive/10" : "bg-accent"}
            href="/jobs"
            loading={jobs.isLoading}
          />
          <MiniStat
            label="Permissions"
            value={permissionCount}
            sub="Your role"
            icon={<ShieldCheck className="size-3.5 text-secondary-foreground" />}
            iconBg="bg-muted"
          />
          <MiniStat
            label="API"
            value={health.isFetching ? "…" : isHealthy ? "OK" : "Down"}
            sub={health.isFetching ? "Checking" : "Health check"}
            icon={
              <Activity
                className={cn(
                  "size-3.5",
                  isHealthy ? "text-primary" : "text-destructive",
                )}
              />
            }
            iconBg={isHealthy ? "bg-primary/10" : "bg-destructive/10"}
            loading={health.isFetching}
          />
        </div>
      )}

      {/* Middle: activity + health / users */}
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1fr)_240px]">
        <Card size="sm" className="flex min-h-0 flex-col">
          <CardHeader className="border-b pb-0">
            <CardTitle>Recent activity</CardTitle>
            <CardAction>
              <Link
                href="/audit-logs"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                All <ArrowRight className="inline size-3" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto py-0">
            {auditLogs.isLoading ? (
              <div className="flex justify-center py-6">
                <Spinner className="size-4" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No recent activity
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentActivity.map((entry) => {
                  const { icon, c } = auditIcon(entry.action);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
                    >
                      <span className={cn("shrink-0", c)}>{icon}</span>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-xs font-medium">
                          {formatAction(entry.action)}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {entry.entityType}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-col gap-2">
          <Card size="sm" className="shrink-0">
            <CardHeader className="border-b pb-0">
              <CardTitle>System health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 py-0">
              {[
                { label: "API", ok: isHealthy },
                { label: "Database", ok: isHealthy },
                {
                  label: "Job queue",
                  ok: failed === 0,
                  detail: failed > 0 ? `${failed} failed` : `${pending} pending`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-1.5 text-xs"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    {item.detail ? (
                      <span className="text-[10px] text-muted-foreground">
                        {item.detail}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium",
                        item.ok ? "text-primary" : "text-destructive",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          item.ok ? "bg-primary" : "bg-destructive",
                        )}
                      />
                      {item.ok ? "OK" : "Issue"}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card size="sm" className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="border-b pb-0">
              <CardTitle>Recent users</CardTitle>
              <CardAction>
                <Link
                  href="/users"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  All <ArrowRight className="inline size-3" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto py-0">
              {users.isLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner className="size-4" />
                </div>
              ) : recentUsers.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No users yet
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recentUsers.map((user) => (
                    <Link
                      key={user.id}
                      href={`/users/${user.id}`}
                      className="flex items-center gap-2 py-2 first:pt-0 last:pb-0 transition-colors hover:text-foreground"
                    >
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium leading-tight">
                          {user.displayName}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground leading-tight">
                          {user.email}
                        </p>
                      </div>
                      <Badge
                        variant={statusVariant(user.status)}
                        className="shrink-0 px-1 py-0 text-[9px] capitalize"
                      >
                        {user.status.toLowerCase()}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick links */}
      <Card size="sm" className="shrink-0">
        <CardContent className="flex flex-wrap items-center gap-1.5 py-0">
          <span className="mr-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Quick
          </span>
          {QUICK_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Button key={item.href} variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs" render={<Link href={item.href} />}>
                <Icon className="size-3" />
                {item.label}
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
