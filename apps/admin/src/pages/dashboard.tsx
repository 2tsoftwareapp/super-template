import { useQuery } from "@tanstack/react-query";
import { FolderKanban, ShieldCheck, Users } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Spinner } from "../components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { webFetch } from "../lib/http";
import type { ListResponse, ProjectRow, UserRow } from "../lib/types";
import { useSession } from "../lib/session";
import type { ReactNode } from "react";

export function DashboardPage() {
  const session = useSession();
  const users = useQuery({
    queryKey: ["admin-users-overview"],
    queryFn: () => webFetch<ListResponse<UserRow>>("/api/bff/admin/users?limit=5"),
  });
  const projects = useQuery({
    queryKey: ["admin-projects-overview"],
    queryFn: () => webFetch<ListResponse<ProjectRow>>("/api/bff/projects?limit=5"),
  });

  if (session.isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">
          Admin
        </Badge>
        <h1 className="text-4xl font-semibold">Admin overview</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Management hub for people, projects, and system controls.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Permissions" value={String(session.data?.data.permissions.length ?? 0)} icon={<ShieldCheck className="size-5 text-primary" />} />
        <MetricCard title="Users" value={String(users.data?.data.length ?? 0)} icon={<Users className="size-5 text-primary" />} />
        <MetricCard title="Projects" value={String(projects.data?.data.length ?? 0)} icon={<FolderKanban className="size-5 text-primary" />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent users</CardTitle>
            <CardDescription>Latest users returned by the admin endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users.data?.data ?? []).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent projects</CardTitle>
            <CardDescription>Projects visible to the admin workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(projects.data?.data ?? []).map((project) => (
              <div key={project.id} className="rounded-2xl border border-border px-4 py-3">
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground">{project.status}</p>
              </div>
            ))}
          </CardContent>
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
  icon: ReactNode;
}) {
  return (
    <Card>
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
