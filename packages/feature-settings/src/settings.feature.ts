import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { applicationSettings } from "./infrastructure/persistence";
import { SettingsModule } from "./settings.module";

export const settingsFeature: FeatureManifest = defineFeature({
  id: "settings",
  dependsOn: ["audit"],
  nestModule: SettingsModule,
  schema: { applicationSettings },
});
