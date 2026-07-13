"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSettings } from "./settings.api";
import { settingsKeys } from "./settings.query-keys";

export function useSettingsQuery() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: fetchSettings,
  });
}
