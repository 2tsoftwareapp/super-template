import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  ShieldCheck,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { buttonVariants } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Spinner } from "../components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { PageHeader } from "../components/page-header";
import { webFetch } from "../lib/http";
import type { ListResponse, ProjectRow, UserRow } from "../lib/types";
import { useSession } from "../lib/session";
import type { ReactNode } from "react";

export function DashboardPage() {
  const session = useSession();
  const users = useQuery({
    queryKey: ["admin-users-overview"],
    queryFn: () =>
      webFetch<ListResponse<UserRow>>("/api/v1/admin/users?limit=5"),
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

  return (
    <div className="space-y-6">
      <PageHeader
        label="Overview"
        title="Admin control room"
        description="People, projects, and platform signals in one place without collapsing the work into one dense screen."
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">
              Live workspace
            </Badge>
            <CardTitle className="text-2xl">What is currently visible</CardTitle>
            <CardDescription>
              The admin surface stays modular: the top summary tells you what
              is loaded, the tables carry the details.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StatBlock
              title="Permissions"
              value={String(session.data?.data.permissions.length ?? 0)}
              helper="Granted to the current account"
              icon={<ShieldCheck className="size-5 text-primary" />}
            />
            <StatBlock
              title="Users"
              value={String(users.data?.data.length ?? 0)}
              helper="Recent admin-side records"
              icon={<Users className="size-5 text-primary" />}
            />
            <StatBlock
              title="Projects"
              value={String(projects.data?.data.length ?? 0)}
              helper="Project records fetched from API"
              icon={<FolderKanban className="size-5 text-primary" />}
            />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="space-y-3">
            <Badge variant="outline" className="w-fit">
              Shortcuts
            </Badge>
            <CardTitle className="text-2xl">Primary entry points</CardTitle>
            <CardDescription>
              Reach the main management flows from one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { href: "/users", label: "Manage users" },
              { href: "/projects", label: "Review projects" },
              { href: "/notifications", label: "Send notifications" },
            ].map((item) => (
              <Link
                key={item.href}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full justify-between",
                })}
                to={item.href}
              >
                <span>{item.label}</span>
                <ArrowUpRight className="size-4" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border bg-card shadow-sm">
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

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Recent projects</CardTitle>
            <CardDescription>Projects visible to the admin workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(projects.data?.data ?? []).map((project) => (
              <div
                key={project.id}
                className="rounded-2xl border border-border bg-muted/20 px-4 py-3"
              >
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

function StatBlock({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {icon}
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}
