"use client";

import { useNotificationsController } from "@/features/notifications/controllers/use-notifications-controller";

import { NotificationsListView } from "../ui/notifications-list-view";
import { createNotificationsColumns } from "../ui/notifications-table-columns";

/**
 * Notifications screen: connects the notifications controller to the
 * presentational view.
 */
export function NotificationsView() {
  const controller = useNotificationsController({ createColumns: createNotificationsColumns });

  return <NotificationsListView {...controller} />;
}
