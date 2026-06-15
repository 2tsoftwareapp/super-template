"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, FolderKanban, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import type {
  NotificationsUnreadResponse,
  ProjectsListResponse,
  UsersListResponse,
} from "@/lib/api-types";
import { webFetch } from "@/lib/http";

export default function DashboardPage() {
  const session = useSession();
  const canReadUsers =
    session.data?.data.permissions.includes("users.read") ?? false;
  const projects = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: () =>
      webFetch<ProjectsListResponse>("/api/bff/projects?page=1&limit=5"),
  });
  const notifications = useQuery({
    queryKey: ["dashboard-notifications-unread"],
    queryFn: () =>
      webFetch<NotificationsUnreadResponse>(
        "/api/bff/notifications/unread-count",
      ),
  });
  const users = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () =>
      webFetch<UsersListResponse>("/api/bff/admin/users?page=1&limit=5"),
    enabled: canReadUsers,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-neutral-500">
          Overview
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Workspace dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Active permissions"
          value={String(session.data?.data.permissions.length ?? 0)}
          icon={<ShieldCheck className="h-5 w-5 text-amber-500" />}
        />
        <MetricCard
          title="Unread notifications"
          value={String(notifications.data?.data.count ?? 0)}
          icon={<Bell className="h-5 w-5 text-amber-500" />}
        />
        <MetricCard
          title="Projects in view"
          value={String(projects.data?.meta.total ?? 0)}
          icon={<FolderKanban className="h-5 w-5 text-amber-500" />}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent projects</h2>
            <Link href="/projects" className="text-sm text-neutral-500">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {projects.data?.data.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-2xl border border-black/8 px-4 py-3 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-neutral-500">{project.status}</p>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Admin surface</h2>
            <Users className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-4 space-y-3">
            {(users.data?.data ?? []).slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-black/8 px-4 py-3 dark:border-white/10"
              >
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </div>
            ))}
            {!canReadUsers && (
              <p className="text-sm text-neutral-500">
                Your current role does not include `users.read`.
              </p>
            )}
          </div>
        </Card>
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
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{title}</p>
        {icon}
      </div>
      <p className="mt-6 text-4xl font-semibold">{value}</p>
    </Card>
  );
}
