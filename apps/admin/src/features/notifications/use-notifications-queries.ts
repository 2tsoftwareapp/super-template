"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchNotificationJobs,
  fetchRecentNotifications,
} from "./api/notifications-api";
import { NOTIFICATION_JOBS_QUERY_KEY, RECENT_NOTIFICATIONS_QUERY_KEY } from "./model/notifications-query-keys";

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
