"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
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
import Link from "next/link";
import { type ReactNode } from "react";

import type {
  AuditLogDto,
  JobDto,
  ListResponse,
  ProjectRow,
  UserRow,
} from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    return { icon: <Users className="size-3" />, c: "text-blue-600 dark:text-blue-400" };
  if (action.startsWith("auth") || action.startsWith("login"))
    return { icon: <LogIn className="size-3" />, c: "text-emerald-600 dark:text-emerald-400" };
  if (action.startsWith("project"))
    return { icon: <FolderKanban className="size-3" />, c: "text-violet-600 dark:text-violet-400" };
  if (action.startsWith("job"))
    return { icon: <Workflow className="size-3" />, c: "text-amber-600 dark:text-amber-400" };
  if (action.startsWith("mail"))
    return { icon: <Mail className="size-3" />, c: "text-sky-600 dark:text-sky-400" };
  return { icon: <Activity className="size-3" />, c: "text-muted-foreground" };
}

const QUICK_ACTIONS = [
  { href: "/users", label: "Users", icon: Users, c: "text-blue-600 dark:text-blue-400" },
  { href: "/projects", label: "Projects", icon: FolderKanban, c: "text-emerald-600 dark:text-emerald-400" },
  { href: "/jobs", label: "Jobs", icon: Workflow, c: "text-amber-600 dark:text-amber-400" },
  { href: "/mail", label: "Mail", icon: Mail, c: "text-sky-600 dark:text-sky-400" },
  { href: "/notifications", label: "Notify", icon: Megaphone, c: "text-rose-600 dark:text-rose-400" },
  { href: "/audit-logs", label: "Audit", icon: Shield, c: "text-violet-600 dark:text-violet-400" },
];

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-7 w-14 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
          <div className="size-9 shrink-0 animate-pulse rounded-lg bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonTable() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-3 w-14 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="p-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="size-7 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, sub, icon, iconBg, loading, href }: {
  label: string; value: string | number; sub: string; icon: ReactNode; iconBg: string;
  loading?: boolean; href?: string;
}) {
  return (
    <Card className="group relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
            {loading ? (
              <div className="h-7 w-14 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            )}
            <p className="text-[11px] text-muted-foreground">{sub}</p>
          </div>
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconBg)}>
            {icon}
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className="absolute inset-0 rounded-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="sr-only">View {label}</span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  const session = useSession();
  const queryClient = useQueryClient();

  const [users, projects, jobs, auditLogs, health] = useQueries({
    queries: [
      {
        queryKey: ["admin-users-overview"],
        queryFn: () => webFetch<ListResponse<UserRow>>("/api/bff/admin/users?limit=5"),
        staleTime: 30_000,
      },
      {
        queryKey: ["admin-projects-overview"],
        queryFn: () => webFetch<ListResponse<ProjectRow>>("/api/bff/projects?limit=5"),
        staleTime: 30_000,
      },
      {
        queryKey: ["admin-jobs-summary"],
        queryFn: () => webFetch<ListResponse<JobDto>>("/api/bff/admin/jobs?limit=100"),
        staleTime: 15_000,
      },
      {
        queryKey: ["admin-audit-summary"],
        queryFn: () => webFetch<ListResponse<AuditLogDto>>("/api/bff/admin/audit-logs?limit=6"),
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

  const isRefreshing = users.isFetching || projects.isFetching || jobs.isFetching || auditLogs.isFetching || health.isFetching;

  if (session.isLoading) {
    return <div className="flex min-h-64 items-center justify-center"><Spinner className="size-5" /></div>;
  }

  const userName = session.data?.data.user.displayName ?? "Admin";
  const permissionCount = session.data?.data.permissions.length ?? 0;
  const totalUsers = users.data?.meta?.total ?? users.data?.data.length ?? 0;
  const totalProjects = projects.data?.meta?.total ?? projects.data?.data.length ?? 0;
  const isHealthy = !health.isError && health.data?.data?.status === "ok";
  const activeJobs = pending + running;
  const firstLoad = users.isLoading && jobs.isLoading && projects.isLoading;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{userName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium",
            health.isFetching ? "border-border" : isHealthy
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}>
            {health.isFetching ? (
              <Spinner className="size-2.5" />
            ) : (
              <span className={cn("size-1.5 rounded-full", isHealthy ? "bg-emerald-500" : "bg-destructive")} />
            )}
            {health.isFetching ? "Checking…" : isHealthy ? "All healthy" : "Degraded"}
          </span>
          <Button variant="outline" size="sm" onClick={() => void queryClient.invalidateQueries()} disabled={isRefreshing}>
            <RefreshCw className={cn("size-3", isRefreshing && "animate-spin")} />
            {isRefreshing ? "" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Failed jobs banner */}
      {!jobs.isLoading && failed > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm dark:border-amber-900 dark:bg-amber-950/20">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-300">
            <strong>{failed} job{failed > 1 ? "s" : ""} failed.</strong>{" "}
            <Link href="/jobs" className="underline underline-offset-4 hover:no-underline">Review in Jobs →</Link>
          </span>
        </div>
      )}

      {/* KPI row */}
      {firstLoad ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat
            label="Users"
            value={totalUsers}
            sub="Registered accounts"
            icon={<Users className="size-4 text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-500/10 dark:bg-blue-400/15"
            href="/users"
            loading={users.isLoading}
          />
          <MiniStat
            label="Projects"
            value={totalProjects}
            sub="Active workspaces"
            icon={<FolderKanban className="size-4 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-500/10 dark:bg-emerald-400/15"
            href="/projects"
            loading={projects.isLoading}
          />
          <MiniStat
            label="Jobs active"
            value={activeJobs}
            sub={failed > 0 ? `${failed} failed · ${pending} pending` : `${pending} pending`}
            icon={<Workflow className={cn("size-4", failed > 0 ? "text-destructive" : "text-amber-600 dark:text-amber-400")} />}
            iconBg={failed > 0 ? "bg-destructive/10" : "bg-amber-500/10 dark:bg-amber-400/15"}
            href="/jobs"
            loading={jobs.isLoading}
          />
          <MiniStat
            label="Permissions"
            value={permissionCount}
            sub="Granted to your role"
            icon={<ShieldCheck className="size-4 text-violet-600 dark:text-violet-400" />}
            iconBg="bg-violet-500/10 dark:bg-violet-400/15"
          />
        </div>
      )}

      {/* Main grid */}
      {firstLoad ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <SkeletonTable />
            <SkeletonTable />
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="px-4 py-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 px-4 pb-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 rounded-lg border border-border p-2.5">
                    <div className="size-4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="px-4 py-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-0 px-4 pb-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-8 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="h-3 w-8 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-2 py-2">
                      <div className="mt-0.5 size-3 animate-pulse rounded bg-muted" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          {/* Left */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
                <CardTitle className="text-sm font-semibold">Recent users</CardTitle>
                <Link href="/users" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all <ArrowRight className="inline size-3" /></Link>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 px-3 text-[11px] font-medium">User</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-medium hidden sm:table-cell">Roles</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-medium">Status</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-medium hidden md:table-cell">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.isLoading ? (
                      <TableRow><TableCell colSpan={4} className="py-8 text-center"><Spinner className="mx-auto size-4" /></TableCell></TableRow>
                    ) : (users.data?.data ?? []).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">No users yet</TableCell></TableRow>
                    ) : (
                      (users.data?.data ?? []).map((user) => (
                        <TableRow key={user.id} className="cursor-pointer">
                          <TableCell className="px-3 py-2.5">
                            <Link href={`/users/${user.id}`} className="flex items-center gap-2.5">
                              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                                {user.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium leading-tight">{user.displayName}</p>
                                <p className="truncate text-[11px] text-muted-foreground leading-tight">{user.email}</p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(user.roles ?? []).slice(0, 2).map((role) => (
                                <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">{role}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <Badge variant={statusVariant(user.status)} className="text-[10px] px-1.5 py-0 capitalize">{user.status.toLowerCase()}</Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-[11px] text-muted-foreground hidden md:table-cell">{timeAgo(user.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
                <CardTitle className="text-sm font-semibold">Recent projects</CardTitle>
                <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all <ArrowRight className="inline size-3" /></Link>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 px-3 text-[11px] font-medium">Project</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-medium">Status</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-medium hidden sm:table-cell">Updated</TableHead>
                      <TableHead className="h-8 px-3 text-[11px] font-medium" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.isLoading ? (
                      <TableRow><TableCell colSpan={4} className="py-8 text-center"><Spinner className="mx-auto size-4" /></TableCell></TableRow>
                    ) : (projects.data?.data ?? []).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">No projects yet</TableCell></TableRow>
                    ) : (
                      (projects.data?.data ?? []).map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="px-3 py-2.5">
                            <p className="text-sm font-medium leading-tight">{project.name}</p>
                            {project.description ? (
                              <p className="max-w-[200px] truncate text-[11px] text-muted-foreground leading-tight">{String(project.description)}</p>
                            ) : null}
                          </TableCell>
                          <TableCell className="px-3 py-2.5">
                            <Badge variant={statusVariant(project.status)} className="text-[10px] px-1.5 py-0 capitalize">{project.status.toLowerCase()}</Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-[11px] text-muted-foreground hidden sm:table-cell">{timeAgo(project.updatedAt)}</TableCell>
                          <TableCell className="px-3 py-2.5">
                            <Link href={`/projects/${project.id}`} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">Open</Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm font-semibold">Quick access</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 px-4 pb-4">
                {QUICK_ACTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}
                      className="flex flex-col items-center gap-1 rounded-lg border border-border p-2.5 text-center transition-colors hover:bg-muted"
                    >
                      <Icon className={cn("size-4", item.c)} />
                      <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm font-semibold">System health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 px-4 pb-3">
                {[
                  { label: "API", ok: isHealthy },
                  { label: "Database", ok: isHealthy },
                  { label: "Job queue", ok: failed === 0, detail: failed > 0 ? `${failed} failed` : `${pending} pending` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.detail && <span className="text-[11px] text-muted-foreground">{item.detail}</span>}
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-medium",
                        item.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                      )}>
                        <span className={cn("size-1.5 rounded-full", item.ok ? "bg-emerald-500" : "bg-destructive")} />
                        {item.ok ? "OK" : "Issue"}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
                <CardTitle className="text-sm font-semibold">Activity</CardTitle>
                <Link href="/audit-logs" className="text-xs text-muted-foreground hover:text-foreground transition-colors">All</Link>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {auditLogs.isLoading ? (
                  <div className="flex justify-center py-4"><Spinner className="size-4" /></div>
                ) : (auditLogs.data?.data ?? []).length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">No recent activity</p>
                ) : (
                  <div className="divide-y divide-border">
                    {(auditLogs.data?.data ?? []).map((entry) => {
                      const { icon, c } = auditIcon(entry.action);
                      return (
                        <div key={entry.id} className="flex items-start gap-2 py-2">
                          <span className={cn("mt-0.5", c)}>{icon}</span>
                          <div className="min-w-0 flex-1 leading-tight">
                            <p className="text-[11px] font-medium">{formatAction(entry.action)}</p>
                            <p className="text-[11px] text-muted-foreground">{entry.entityType}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(entry.createdAt)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
