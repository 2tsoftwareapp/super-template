import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  FolderKanban,
  LogIn,
  Mail,
  Megaphone,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { Link } from "react-router-dom";

import type { AuditLogDto, JobDto, ListResponse, ProjectRow, UserRow } from "../lib/types";

import { Alert } from "../components/ui/alert";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button, buttonVariants } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Spinner } from "../components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { webFetch } from "../lib/http";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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

// ── Audit icon config ─────────────────────────────────────────────────────────

function auditIconConfig(action: string): { icon: ReactNode; bg: string; fg: string } {
  if (action.startsWith("user"))
    return { icon: <Users className="size-3.5" />, bg: "bg-blue-500/10", fg: "text-blue-600 dark:text-blue-400" };
  if (action.startsWith("auth") || action.startsWith("login") || action.startsWith("session"))
    return { icon: <LogIn className="size-3.5" />, bg: "bg-emerald-500/10", fg: "text-emerald-600 dark:text-emerald-400" };
  if (action.startsWith("project"))
    return { icon: <FolderKanban className="size-3.5" />, bg: "bg-violet-500/10", fg: "text-violet-600 dark:text-violet-400" };
  if (action.startsWith("job"))
    return { icon: <Workflow className="size-3.5" />, bg: "bg-amber-500/10", fg: "text-amber-600 dark:text-amber-400" };
  if (action.startsWith("mail"))
    return { icon: <Mail className="size-3.5" />, bg: "bg-sky-500/10", fg: "text-sky-600 dark:text-sky-400" };
  return { icon: <Activity className="size-3.5" />, bg: "bg-muted", fg: "text-muted-foreground" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon,
  iconBg,
  loading,
  href,
}: {
  title: string;
  value: string | number;
  sub: string | ReactNode;
  icon: ReactNode;
  iconBg?: string;
  loading?: boolean;
  href?: string;
}) {
  return (
    <Card className="group overflow-hidden">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-14 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{sub}</p>
              {href && (
                <Link
                  to={href}
                  className="flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground underline-offset-4 opacity-0 transition-opacity hover:underline group-hover:opacity-100"
                >
                  View <ArrowUpRight className="size-3" />
                </Link>
              )}
            </div>
          </div>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconBg ?? "bg-muted")}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthRow({
  label,
  ok,
  loading,
  detail,
}: {
  label: string;
  ok: boolean;
  loading?: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
        {loading ? (
          <Spinner className="size-3" />
        ) : ok ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            Healthy
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <span className="size-1.5 rounded-full bg-destructive" />
            Issue
          </span>
        )}
      </div>
    </div>
  );
}

// ── Quick action items ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { href: "/users",         label: "Users",         desc: "Manage accounts",  icon: Users,        iconBg: "bg-blue-500/10",   iconFg: "text-blue-600 dark:text-blue-400" },
  { href: "/projects",      label: "Projects",      desc: "View workspaces",  icon: FolderKanban, iconBg: "bg-emerald-500/10", iconFg: "text-emerald-600 dark:text-emerald-400" },
  { href: "/jobs",          label: "Jobs",          desc: "Monitor queue",    icon: Workflow,     iconBg: "bg-amber-500/10",  iconFg: "text-amber-600 dark:text-amber-400" },
  { href: "/mail",          label: "Mail",          desc: "Check deliveries", icon: Mail,         iconBg: "bg-sky-500/10",    iconFg: "text-sky-600 dark:text-sky-400" },
  { href: "/notifications", label: "Notifications", desc: "Send alerts",      icon: Megaphone,    iconBg: "bg-rose-500/10",   iconFg: "text-rose-600 dark:text-rose-400" },
  { href: "/audit-logs",    label: "Audit logs",    desc: "Review events",    icon: Shield,       iconBg: "bg-violet-500/10", iconFg: "text-violet-600 dark:text-violet-400" },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const session = useSession();
  const queryClient = useQueryClient();

  const users = useQuery({
    queryKey: ["admin-users-overview"],
    queryFn: () => webFetch<ListResponse<UserRow>>("/api/v1/admin/users?limit=8"),
    staleTime: 30_000,
  });

  const projects = useQuery({
    queryKey: ["admin-projects-overview"],
    queryFn: () => webFetch<ListResponse<ProjectRow>>("/api/v1/projects?limit=6"),
    staleTime: 30_000,
  });

  const jobs = useQuery({
    queryKey: ["admin-jobs-summary"],
    queryFn: () => webFetch<ListResponse<JobDto>>("/api/v1/admin/jobs?limit=100"),
    staleTime: 15_000,
  });

  const auditLogs = useQuery({
    queryKey: ["admin-audit-summary"],
    queryFn: () => webFetch<ListResponse<AuditLogDto>>("/api/v1/admin/audit-logs?limit=10"),
    staleTime: 15_000,
  });

  const health = useQuery({
    queryKey: ["admin-health"],
    queryFn: () => webFetch<{ data: { status: string } }>("/api/v1/health"),
    staleTime: 10_000,
    retry: 1,
  });

  const jobStats = useMemo(() => {
    const data = jobs.data?.data ?? [];
    return {
      pending: data.filter((j) => j.status === "PENDING").length,
      running: data.filter((j) => j.status === "PROCESSING").length,
      failed: data.filter((j) => j.status === "FAILED").length,
    };
  }, [jobs.data]);

  const isRefreshing =
    users.isFetching ||
    projects.isFetching ||
    jobs.isFetching ||
    auditLogs.isFetching ||
    health.isFetching;

  const refreshAll = () => void queryClient.invalidateQueries();

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
  const totalProjects = projects.data?.meta?.total ?? projects.data?.data.length ?? 0;
  const isHealthy = !health.isError && health.data?.data?.status === "ok";
  const activeJobs = jobStats.pending + jobStats.running;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={userName} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting()}, {userName}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5",
              health.isFetching
                ? "border-border bg-card"
                : isHealthy
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : "border-destructive/30 bg-destructive/5",
            )}
          >
            {health.isFetching ? (
              <Spinner className="size-3" />
            ) : isHealthy ? (
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
            ) : (
              <span className="size-2 rounded-full bg-destructive" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                !health.isFetching && isHealthy && "text-emerald-700 dark:text-emerald-400",
                !health.isFetching && !isHealthy && "text-destructive",
              )}
            >
              {health.isFetching ? "Checking…" : isHealthy ? "All systems go" : "API unreachable"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isRefreshing}>
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Failed jobs alert ── */}
      {!jobs.isLoading && jobStats.failed > 0 && (
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              <strong>{jobStats.failed} job{jobStats.failed > 1 ? "s" : ""} failed.</strong>{" "}
              <Link to="/jobs" className="underline underline-offset-4 hover:no-underline">
                Review in Jobs →
              </Link>
            </span>
          </div>
        </Alert>
      )}

      {/* ── KPI row ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total users"
          value={totalUsers}
          sub="registered accounts"
          icon={<Users className="size-4 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-500/10"
          href="/users"
          loading={users.isLoading}
        />
        <KpiCard
          title="Projects"
          value={totalProjects}
          sub="active workspaces"
          icon={<FolderKanban className="size-4 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          href="/projects"
          loading={projects.isLoading}
        />
        <KpiCard
          title="Jobs active"
          value={activeJobs}
          sub={
            jobStats.failed > 0
              ? `${jobStats.failed} failed · ${jobStats.pending} pending`
              : `${jobStats.pending} pending · none failed`
          }
          icon={
            <Workflow
              className={cn(
                "size-4",
                jobStats.failed > 0
                  ? "text-destructive"
                  : "text-amber-600 dark:text-amber-400",
              )}
            />
          }
          iconBg={jobStats.failed > 0 ? "bg-destructive/10" : "bg-amber-500/10"}
          href="/jobs"
          loading={jobs.isLoading}
        />
        <KpiCard
          title="Permissions"
          value={permissionCount}
          sub="granted to your role"
          icon={<ShieldCheck className="size-4 text-violet-600 dark:text-violet-400" />}
          iconBg="bg-violet-500/10"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Recent users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Recent users</CardTitle>
                <CardDescription className="text-xs">Latest registered accounts</CardDescription>
              </div>
              <Link
                to="/users"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
              >
                View all
                <ArrowUpRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center">
                        <Spinner className="mx-auto size-4" />
                      </TableCell>
                    </TableRow>
                  ) : (users.data?.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No users yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    (users.data?.data ?? []).map((user) => (
                      <TableRow key={user.id} className="cursor-pointer">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={user.displayName} size="sm" />
                            <div className="min-w-0">
                              <Link
                                to={`/users/${user.id}`}
                                className="block truncate text-sm font-medium hover:underline"
                              >
                                {user.displayName}
                              </Link>
                              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(user.roles ?? []).slice(0, 2).map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs capitalize">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(user.status)} className="capitalize text-xs">
                            {user.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {timeAgo(user.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base">Recent projects</CardTitle>
                <CardDescription className="text-xs">Latest workspace activity</CardDescription>
              </div>
              <Link
                to="/projects"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
              >
                View all
                <ArrowUpRight className="size-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Updated</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center">
                        <Spinner className="mx-auto size-4" />
                      </TableCell>
                    </TableRow>
                  ) : (projects.data?.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No projects yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    (projects.data?.data ?? []).map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{project.name}</p>
                          {project.description ? (
                            <p className="max-w-[220px] truncate text-xs text-muted-foreground">
                              {String(project.description)}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(project.status)} className="capitalize text-xs">
                            {project.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {timeAgo(project.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/projects/${project.id}`}
                            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                          >
                            Open
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          {/* System health */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-base">System health</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border px-5 pb-2">
              <HealthRow label="API" ok={isHealthy} loading={health.isLoading} />
              <HealthRow label="Database" ok={isHealthy} loading={health.isLoading} />
              <HealthRow
                label="Job queue"
                ok={jobStats.failed === 0}
                loading={jobs.isLoading}
                detail={
                  jobStats.failed > 0
                    ? `${jobStats.failed} failed`
                    : `${jobStats.pending} pending`
                }
              />
            </CardContent>
          </Card>

          {/* Live audit feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Recent activity</CardTitle>
              <Link
                to="/audit-logs"
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                All logs
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-2">
              {auditLogs.isLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner className="size-4" />
                </div>
              ) : (auditLogs.data?.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No recent activity
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {(auditLogs.data?.data ?? []).map((entry) => {
                    const { icon, bg, fg } = auditIconConfig(entry.action);
                    const actorId = typeof entry.actorId === "string" && entry.actorId ? entry.actorId : null;
                    return (
                      <div key={entry.id} className="flex items-start gap-2.5 py-2.5">
                        <div
                          className={cn(
                            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                            bg,
                            fg,
                          )}
                        >
                          {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium leading-snug">
                            {formatAction(entry.action)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.entityType}
                            {actorId ? ` · ${actorId.slice(0, 8)}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                          {timeAgo(entry.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick actions</CardTitle>
              <CardDescription className="text-xs">Navigate to common pages</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 pb-4">
              {QUICK_ACTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="group flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center transition-colors hover:bg-muted"
                  >
                    <div
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                        item.iconBg,
                      )}
                    >
                      <Icon className={cn("size-4", item.iconFg)} />
                    </div>
                    <span className="text-xs font-medium leading-tight">{item.label}</span>
                    <span className="text-[10px] leading-tight text-muted-foreground">{item.desc}</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
