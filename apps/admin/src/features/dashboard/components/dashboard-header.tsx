import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  userName: string;
  isHealthy: boolean;
  healthFetching: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  userName,
  isHealthy,
  healthFetching,
  isRefreshing,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <p className="truncate text-sm text-muted-foreground">
        Welcome back,{" "}
        <span className="font-medium text-foreground">{userName}</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium",
            healthFetching
              ? "border-border"
              : isHealthy
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
        >
          {healthFetching ? (
            <Spinner className="size-2" />
          ) : (
            <span
              className={cn(
                "size-1.5 rounded-full",
                isHealthy ? "bg-primary" : "bg-destructive",
              )}
            />
          )}
          {healthFetching
            ? "Checking"
            : isHealthy
              ? "Healthy"
              : "Degraded"}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("size-3", isRefreshing && "animate-spin")}
          />
          <span className="sr-only md:not-sr-only md:ml-1.5">
            {isRefreshing ? "Refreshing" : "Refresh"}
          </span>
        </Button>
      </div>
    </div>
  );
}
