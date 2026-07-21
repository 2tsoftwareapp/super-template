"use client";

import { useDashboardController } from "@/features/dashboard/controllers/use-dashboard-controller";

import { DashboardOverview } from "../ui/dashboard-overview";

/**
 * Dashboard screen: connects the dashboard controller to the presentational
 * overview. Refresh keeps the overview mounted (header spinner only).
 */
export function DashboardView() {
  const controller = useDashboardController();
  return <DashboardOverview {...controller} />;
}
