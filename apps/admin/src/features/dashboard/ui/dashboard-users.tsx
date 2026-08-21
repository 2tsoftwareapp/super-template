import { Badge } from "@repo/web-ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@repo/web-ui/card";
import { ErrorState } from "@repo/web-ui/error-state";
import { SectionLoading } from "@repo/web-ui/loading";
import { ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

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
        {isLoading ? (
          <SectionLoading title="Loading users..." className="min-h-24" />
        ) : isError ? (
          <ErrorState
            variant="inline"
            className="mx-0 mb-2 mt-2"
            title="Could not load recent users."
            action={{ label: "Retry", onClick: onRetry }}
          />
        ) : recentUsers.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No users yet</p>
        ) : (
          <div className="divide-y divide-border">
            {recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 transition-colors hover:bg-muted/50 rounded-lg -mx-1 px-1"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground leading-tight">
                    {user.displayName}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground leading-tight">
                    {user.email}
                  </p>
                </div>
                <Badge
                  variant={statusVariant(user.status)}
                  className="shrink-0 px-1.5 py-0 text-[9px] capitalize"
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

function statusVariant(status: string): "default" | "secondary" | "outline" {
  const s = status.toLowerCase();
  if (s === "active" || s === "completed") return "default";
  if (s === "pending" || s === "processing" || s === "running") return "secondary";
  return "outline";
}
