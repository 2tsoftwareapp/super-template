"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSettings } from "./settings-service";

export const SETTINGS_QUERY_KEY = "admin-settings" as const;

export function useSettingsQuery() {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: fetchSettings,
  });
}
