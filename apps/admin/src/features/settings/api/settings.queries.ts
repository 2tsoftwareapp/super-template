"use client";

import { useQuery } from "@tanstack/react-query";

import { settingsApi } from "./settings.api";
import { settingsKeys } from "./settings.query-keys";

const SETTINGS_STALE_TIME_MS = 5 * 60_000;

export function useSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => settingsApi.list(),
    staleTime: SETTINGS_STALE_TIME_MS,
  });
}
