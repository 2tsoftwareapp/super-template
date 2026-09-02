import { Badge } from "@repo/web-ui/badge";
import { Button } from "@repo/web-ui/button";
import { Card, CardContent, CardHeader } from "@repo/web-ui/card";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@repo/web-ui/empty";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { ArrowRight, UserCheck, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  displayName: string;
  email: string;
  status: string;
}

interface DashboardUsersProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  recentUsers: User[];
}

export function DashboardUsers({ isLoading, isError, onRetry, recentUsers }: DashboardUsersProps) {
  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Recent Users</h3>
          </div>
          <p className="text-xs text-muted-foreground">Newly active accounts in workspace</p>
        </div>

        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground" asChild>
          <Link href="/users">
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <SectionLoading title="Loading recent users..." className="min-h-32" />
          </div>
        ) : isError ? (
          <div className="p-5">
            <ErrorState
              variant="inline"
              className="m-0"
              title="Could not load users."
              action={{ label: "Retry", onClick: onRetry }}
            />
          </div>
        ) : recentUsers.length === 0 ? (
          <Empty className="py-8">
            <EmptyContent>
              <EmptyHeader>
                <EmptyTitle>No users found</EmptyTitle>
              </EmptyHeader>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="divide-y divide-border/60">
            {recentUsers.slice(0, 5).map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-2 ring-primary/20 transition-transform group-hover:scale-105">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      {user.displayName || "Unknown User"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={statusVariant(user.status)}
                  className="shrink-0 px-2 py-0.5 text-[10px] font-medium capitalize"
                >
                  {user.status.toLowerCase()}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  const s = status.toLowerCase();
  if (s === "active" || s === "completed") return "default";
  if (s === "pending" || s === "processing" || s === "running") return "secondary";
  if (s === "blocked" || s === "disabled" || s === "failed") return "destructive";
  return "outline";
}
