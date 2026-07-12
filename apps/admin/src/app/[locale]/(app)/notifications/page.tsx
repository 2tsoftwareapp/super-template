import type { Metadata } from "next";

import { NotificationsView } from "@/features/notifications/screens/notifications-view";

export const metadata: Metadata = {
  title: "Notifications | Super Admin",
  description: "Dispatch system announcements, push updates, and alerts.",
};

export default function Page() {
  return <NotificationsView />;
}
