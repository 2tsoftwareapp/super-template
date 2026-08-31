import type { Metadata } from "next";

import { OrganizationSettingsView } from "@/features/settings/screens/organization-settings-view";

export const metadata: Metadata = {
  title: "Organization Settings | Super Admin",
  description: "Manage your organization settings and team.",
};

export default function OrganizationSettingsPage() {
  return <OrganizationSettingsView />;
}
