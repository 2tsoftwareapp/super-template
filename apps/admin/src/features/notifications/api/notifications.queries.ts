"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchNotificationJobs,
  fetchRecentNotifications,
} from "./notifications.api";
import { notificationsKeys } from "./notifications.query-keys";

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
