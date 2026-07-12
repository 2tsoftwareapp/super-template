import { Badge } from "@repo/web-core/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/web-core/components/card";
import { SectionLoading } from "@repo/web-core/components/loading";
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
  recentUsers: User[];
}

export function DashboardUsers({
  isLoading,
  recentUsers,
}: DashboardUsersProps) {
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
  );
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  const s = status.toLowerCase();
  if (s === "active" || s === "completed") return "default";
  if (s === "pending" || s === "processing" || s === "running")
    return "secondary";
  return "outline";
}
