"use client";

import { useNotificationsController } from "@/features/notifications/controllers/use-notifications-controller";

import { NotificationsListView } from "../ui/notifications-list-view";

/**
 * Notifications screen: connects the notifications controller to the
 * presentational view.
 */
export function NotificationsView() {
  const controller = useNotificationsController();

  return <NotificationsListView {...controller} />;
}
