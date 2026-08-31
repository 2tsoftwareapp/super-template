import type { Metadata } from "next";

import { ProfileSettingsView } from "@/features/settings/screens/profile-settings-view";

export const metadata: Metadata = {
  title: "Profile Settings | Super Admin",
  description: "Manage your account profile and display preferences.",
};

export default function ProfileSettingsPage() {
  return <ProfileSettingsView />;
}
