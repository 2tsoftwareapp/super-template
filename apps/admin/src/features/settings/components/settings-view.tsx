"use client";

import { useSettingsController } from "@/features/settings/use-settings-controller";

import { SettingsListView } from "./settings-list-view";

/**
 * Settings screen: connects the settings controller to the presentational view.
 */
export function SettingsView() {
  const controller = useSettingsController();

  return <SettingsListView {...controller} />;
}
