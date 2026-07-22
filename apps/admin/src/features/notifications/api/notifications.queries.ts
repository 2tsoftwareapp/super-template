"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationsApi } from "./notifications.api";
import { notificationsKeys } from "./notifications.query-keys";

export function useNotificationJobsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationsKeys.jobs(),
    queryFn: () => notificationsApi.jobs(),
    staleTime: 0,
    enabled,
  });
}

export function useRecentNotificationsQuery() {
  return useQuery({
    queryKey: notificationsKeys.recent(),
    queryFn: () => notificationsApi.recent(),
    staleTime: 0,
  });
}
