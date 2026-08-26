import type { Metadata } from "next";

import { SettingsView } from "@repo/feature-platform/admin";

export const metadata: Metadata = {
  title: "System Settings | Super Admin",
  description: "View and customize platform-wide operations and settings.",
};

export default function Page() {
  return <SettingsView />;
}
