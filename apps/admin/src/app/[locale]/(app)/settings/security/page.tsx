import type { Metadata } from "next";

import { SecuritySettingsView } from "@/features/settings/screens/security-settings-view";

export const metadata: Metadata = {
  title: "Security Settings | Super Admin",
  description: "Manage password, MFA, and security preferences.",
};

export default function SecuritySettingsPage() {
  return <SecuritySettingsView />;
}
