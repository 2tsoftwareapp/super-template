"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchNotificationJobs,
  fetchRecentNotifications,
} from "./notifications-service";

export const NOTIFICATION_JOBS_QUERY_KEY = "admin-notification-jobs" as const;
export const RECENT_NOTIFICATIONS_QUERY_KEY = "admin-notifications" as const;

export function useNotificationJobsQuery() {
  return useQuery({
    queryKey: [NOTIFICATION_JOBS_QUERY_KEY],
    queryFn: fetchNotificationJobs,
  });
}

export function useRecentNotificationsQuery() {
  return useQuery({
    queryKey: [RECENT_NOTIFICATIONS_QUERY_KEY],
    queryFn: fetchRecentNotifications,
  });
}
