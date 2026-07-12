"use client";

import { useSettingsController } from "@/features/settings/controllers/use-settings-controller";

import { SettingsListView } from "../ui/settings-list-view";

/**
 * Settings screen: connects the settings controller to the presentational view.
 */
export function SettingsView() {
  const controller = useSettingsController();

  return <SettingsListView {...controller} />;
}
