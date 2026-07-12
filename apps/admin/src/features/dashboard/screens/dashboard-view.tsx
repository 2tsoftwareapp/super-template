"use client";

import { useDashboardController } from "@/features/dashboard/controllers/use-dashboard-controller";

import { DashboardOverview } from "../ui/dashboard-overview";

/**
 * Dashboard screen: connects the dashboard controller to the presentational
 * overview and handles the top-level refreshing boundary.
 */
export function DashboardView() {
  const controller = useDashboardController();

  if (controller.isRefreshing) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <p className="text-xs text-muted-foreground">Refreshing dashboard…</p>
        </div>
      </div>
    );
  }

  return <DashboardOverview {...controller} />;
}
