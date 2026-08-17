import { Button } from "@repo/web-ui/button";
import { RefreshCw, UserPlus, Users } from "lucide-react";

import { cn } from "@/lib/utils";

interface UsersHeaderProps {
  isLoading: boolean;
  isFetching: boolean;
  total: number;
  canCreate: boolean;
  onRefresh: () => void;
  onCreateClick: () => void;
}

export function UsersHeader({
  isLoading,
  isFetching,
  total,
  canCreate,
  onRefresh,
  onCreateClick,
}: UsersHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
          <Users className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="truncate text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : total === 0
                ? "No users yet"
                : `${total} user${total > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
          <RefreshCw className={cn("size-3", isFetching && "animate-spin")} />
          Refresh
        </Button>
        {canCreate ? (
          <Button size="sm" onClick={onCreateClick}>
            <UserPlus data-icon="inline-start" />
            New user
          </Button>
        ) : null}
      </div>
    </div>
  );
}
