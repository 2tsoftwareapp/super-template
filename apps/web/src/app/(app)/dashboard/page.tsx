"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  FolderKanban,
  Plus,
  Settings,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import type {
  NotificationsUnreadResponse,
  ProjectsListResponse,
} from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSession } from "@/hooks/use-session";
import { webFetch } from "@/lib/http";
import { buildProjectsListPath } from "@/lib/search-params";

export default function DashboardPage() {
  const session = useSession();
  const projects = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: () =>
      webFetch<ProjectsListResponse>(buildProjectsListPath({ limit: 5 })),
  });
  const notifications = useQuery({
    queryKey: ["dashboard-notifications-unread"],
    queryFn: () =>
      webFetch<NotificationsUnreadResponse>(
        "/api/bff/notifications/unread-count",
      ),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Client
        </Badge>
        <h1 className="text-4xl font-semibold">Client workspace</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Manage projects, read notifications, and keep publish-side work in one
          place. Admin tools live in a separate group in the sidebar.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Active permissions"
          value={String(session.data?.data.permissions.length ?? 0)}
          icon={<ShieldCheck className="size-5 text-primary" />}
        />
        <MetricCard
          title="Unread notifications"
          value={String(notifications.data?.data.count ?? 0)}
          icon={<Bell className="size-5 text-primary" />}
        />
        <MetricCard
          title="Projects in view"
          value={String(projects.data?.meta.total ?? 0)}
          icon={<FolderKanban className="size-5 text-primary" />}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl">Recent projects</CardTitle>
              <CardDescription>
                The latest client-facing records from the workspace.
              </CardDescription>
            </div>
            <Link href="/projects" className="text-sm text-muted-foreground">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.data?.data.length ? (
              projects.data.data.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{project.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {typeof project.description === "string"
                        ? project.description
                        : "No description yet."}
                    </p>
                  </div>
                  <Badge variant="outline">{project.status}</Badge>
                </Link>
              ))
            ) : (
              <Empty className="min-h-40 border-border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderKanban className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No projects yet</EmptyTitle>
                  <EmptyDescription>
                    Create a project to populate the client workspace.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl">Client actions</CardTitle>
              <CardDescription>
                Fast entry points for publish-side work.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link
                href="/projects/new"
                className={buttonVariants({ className: "justify-start" })}
              >
                <Plus className="mr-2 size-4" />
                Create project
              </Link>
              <Link
                href="/notifications"
                className={buttonVariants({
                  variant: "outline",
                  className: "justify-start",
                })}
              >
                <Bell className="mr-2 size-4" />
                Review notifications
              </Link>
              <Link
                href="/settings/profile"
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-start",
                })}
              >
                <Settings className="mr-2 size-4" />
                Update settings
              </Link>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl">Publish rhythm</CardTitle>
              <CardDescription>
                Keep the client workspace moving without mixing in admin tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl border border-border px-4 py-3">
                <Workflow className="mt-0.5 size-4 text-primary" />
                <p>Use projects for client-visible work and drafts.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border px-4 py-3">
                <Bell className="mt-0.5 size-4 text-primary" />
                <p>Notifications surface status changes and review requests.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <CardTitle className="mt-2 text-4xl">{value}</CardTitle>
        </div>
        {icon}
      </CardHeader>
    </Card>
  );
}
