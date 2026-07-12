"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSettings } from "./api/settings-api";
import { SETTINGS_QUERY_KEY } from "./model/settings-query-keys";

export function useSettingsQuery() {
  return useQuery({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: fetchSettings,
  });
}
