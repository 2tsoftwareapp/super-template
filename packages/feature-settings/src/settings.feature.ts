import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { applicationSettings } from "./infrastructure/persistence";
import { settingsSeeders } from "./seed";
import { SettingsModule } from "./settings.module";

export const settingsFeature: FeatureManifest = defineFeature({
  id: "settings",
  // No audit dep: settings schema/seed is independent, and audit→upload→users
  // would cycle if users also dependsOn settings for seeder order.
  dependsOn: [],
  nestModule: SettingsModule,
  resourceScopes: {
    settings: "platform",
  },
  schema: { applicationSettings },
  seeders: settingsSeeders,
});
