"use client";

import { useQuery } from "@tanstack/react-query";

import { notificationsApi } from "./notifications.api";
import { notificationsKeys } from "./notifications.query-keys";

export function useNotificationJobsQuery(enabled = true, sortOrder?: "asc" | "desc") {
  return useQuery({
    queryKey: notificationsKeys.jobs({ sortOrder }),
    queryFn: () => notificationsApi.jobs(sortOrder),
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
