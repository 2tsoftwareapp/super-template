import type { Metadata } from "next";

import { SettingsView } from "@/features/_plugin-resources/platform-admin";

export const metadata: Metadata = {
  title: "System Settings | Super Admin",
  description: "View and customize platform-wide operations and settings.",
};

export default function Page() {
  return <SettingsView />;
}
