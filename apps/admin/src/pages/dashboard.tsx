import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  FolderKanban,
  ShieldCheck,
  TrendingUp,
  Users,
  Workflow,
  Mail,
  Activity,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Spinner } from "../components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { webFetch } from "../lib/http";
import type { ListResponse, ProjectRow, UserRow } from "../lib/types";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";
import type { ReactNode } from "react";

// ── Tiny bar chart ───────────────────────────────────────────────────────────

function MiniBarChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-10 items-end gap-0.5">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-t-sm bg-primary/20 transition-all"
          style={{ height: `${Math.round((v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  trend,
  icon,
  sparkline,
}: {
  title: string;
  value: string | number;
  sub: string;
  trend?: string;
  icon: ReactNode;
  sparkline?: number[];
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-2">
              {trend && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <TrendingUp className="size-3" />
                  {trend}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{sub}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
              {icon}
            </div>
            {sparkline && <MiniBarChart values={sparkline} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Activity item ─────────────────────────────────────────────────────────────

function ActivityItem({
  icon,
  title,
  time,
  badge,
}: {
  icon: ReactNode;
  title: string;
  time: string;
  badge?: { label: string; variant?: "default" | "outline" | "secondary" };
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{title}</p>
        <div className="mt-1 flex items-center gap-2">
          <Clock className="size-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{time}</span>
          {badge && (
            <Badge variant={badge.variant ?? "secondary"} className="text-xs">
              {badge.label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const mockSparklines = {
  users: [12, 15, 11, 18, 22, 19, 25],
  projects: [4, 7, 5, 9, 6, 11, 8],
  jobs: [30, 45, 28, 52, 41, 38, 60],
  mail: [8, 12, 9, 15, 11, 18, 14],
};

const recentActivity = [
  {
    icon: <Users className="size-3.5" />,
    title: "New user registered: john.doe@example.com",
    time: "2 minutes ago",
    badge: { label: "User", variant: "outline" as const },
  },
  {
    icon: <FolderKanban className="size-3.5" />,
    title: "Project \"Alpha\" status changed to active",
    time: "14 minutes ago",
    badge: { label: "Project", variant: "secondary" as const },
  },
  {
    icon: <ShieldCheck className="size-3.5" />,
    title: "Admin login from 192.168.1.42",
    time: "1 hour ago",
    badge: { label: "Auth", variant: "outline" as const },
  },
  {
    icon: <Workflow className="size-3.5" />,
    title: "Background job cleanup-old-sessions completed",
    time: "3 hours ago",
    badge: { label: "Job", variant: "secondary" as const },
  },
  {
    icon: <Mail className="size-3.5" />,
    title: "Welcome email sent to 3 new users",
    time: "5 hours ago",
    badge: { label: "Mail", variant: "outline" as const },
  },
];

export function DashboardPage() {
  const session = useSession();
  const users = useQuery({
    queryKey: ["admin-users-overview"],
    queryFn: () => webFetch<ListResponse<UserRow>>("/api/v1/admin/users?limit=5"),
  });
  const projects = useQuery({
    queryKey: ["admin-projects-overview"],
    queryFn: () => webFetch<ListResponse<ProjectRow>>("/api/v1/projects?limit=5"),
  });

  if (session.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  const userCount = users.data?.data.length ?? 0;
  const projectCount = projects.data?.data.length ?? 0;
  const permissionCount = session.data?.data.permissions.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back,{" "}
            <span className="font-medium text-foreground">
              {session.data?.data.user.displayName}
            </span>
            . Here&apos;s what&apos;s happening.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <Activity className="size-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-emerald-600">All systems normal</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total users"
          value={userCount}
          sub="from admin endpoint"
          trend="+12%"
          icon={<Users className="size-4 text-muted-foreground" />}
          sparkline={mockSparklines.users}
        />
        <KpiCard
          title="Active projects"
          value={projectCount}
          sub="visible to admin"
          trend="+5%"
          icon={<FolderKanban className="size-4 text-muted-foreground" />}
          sparkline={mockSparklines.projects}
        />
        <KpiCard
          title="Permissions"
          value={permissionCount}
          sub="granted to your role"
          icon={<ShieldCheck className="size-4 text-muted-foreground" />}
          sparkline={mockSparklines.jobs}
        />
        <KpiCard
          title="Jobs queued"
          value="3"
          sub="scheduled background tasks"
          icon={<Workflow className="size-4 text-muted-foreground" />}
          sparkline={mockSparklines.mail}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Tables */}
        <div className="space-y-6">
          {/* Users table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent users</CardTitle>
                <CardDescription>Latest accounts from the admin endpoint.</CardDescription>
              </div>
              <Link
                to="/users"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        <Spinner className="mx-auto size-4" />
                      </TableCell>
                    </TableRow>
                  ) : (users.data?.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (users.data?.data ?? []).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <Link
                            to={`/users/${user.id}`}
                            className="hover:underline"
                          >
                            {user.displayName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === "active" ? "default" : "outline"}
                            className="capitalize"
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Projects table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent projects</CardTitle>
                <CardDescription>Projects visible to the admin workspace.</CardDescription>
              </div>
              <Link
                to="/projects"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View all
                <ArrowUpRight className="size-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 pb-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        <Spinner className="mx-auto size-4" />
                      </TableCell>
                    </TableRow>
                  ) : (projects.data?.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground"
                      >
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (projects.data?.data ?? []).map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/projects/${project.id}`}
                            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                          >
                            View
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

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest platform events.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0 px-5 pb-2">
              {recentActivity.map((item, i) => (
                <ActivityItem key={i} {...item} />
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Common management tasks.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                { href: "/users", label: "Manage users", icon: Users },
                { href: "/projects", label: "Review projects", icon: FolderKanban },
                { href: "/notifications", label: "Send notification", icon: Activity },
                { href: "/jobs", label: "Monitor jobs", icon: Workflow },
                { href: "/mail", label: "View mail queue", icon: Mail },
                { href: "/audit-logs", label: "Audit logs", icon: ShieldCheck },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "justify-between",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {item.label}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
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
