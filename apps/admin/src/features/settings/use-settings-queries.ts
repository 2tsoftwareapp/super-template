"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSettings } from "./api/settings-api";
import { settingsKeys } from "./model/settings-query-keys";

export function useSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: fetchSettings,
  });
}
