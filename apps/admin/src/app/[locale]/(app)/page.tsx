import type { Metadata } from "next";

import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | Super Admin",
  description: "Overview of your workspace statistics and system performance.",
};

export default function Page() {
  return <DashboardView />;
}
