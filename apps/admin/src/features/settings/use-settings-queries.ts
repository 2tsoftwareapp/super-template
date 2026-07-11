"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSettings } from "./settings-service";

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettings,
  });
}
