import type { Metadata } from "next";

import { AuthGate } from "@/components/auth-gate";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | Super Admin",
  description: "Overview of your workspace statistics and system performance.",
};

export default function Page() {
  return (
    <AuthGate
      fallbackTitle="Initializing Dashboard"
      fallbackDescription="Loading overview and analytics metrics..."
    >
      <DashboardView />
    </AuthGate>
  );
}
