"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchNotificationJobs,
  fetchRecentNotifications,
} from "./api/notifications-api";
import { notificationsKeys } from "./model/notifications-query-keys";

export function useNotificationJobsQuery() {
  return useQuery({
    queryKey: notificationsKeys.jobs,
    queryFn: fetchNotificationJobs,
  });
}

export function useRecentNotificationsQuery() {
  return useQuery({
    queryKey: notificationsKeys.recent,
    queryFn: fetchRecentNotifications,
  });
}
