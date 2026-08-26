import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { applicationSettings } from "./infrastructure/persistence";
import { settingsSeeders } from "./seed";
import { SettingsModule } from "./settings.module";

export const settingsFeature: FeatureManifest = defineFeature({
  id: "settings",
  dependsOn: ["audit"],
  nestModule: SettingsModule,
  resourceScopes: {
    settings: "platform",
  },
  schema: { applicationSettings },
  seeders: settingsSeeders,
});
