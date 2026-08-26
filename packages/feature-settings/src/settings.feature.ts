import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { applicationSettings } from "./infrastructure/persistence";
import { settingsSeeders } from "./seed";
import { SettingsModule } from "./settings.module";

export const settingsFeature: FeatureManifest = defineFeature({
  id: "settings",
  // Writes audit through the kernel AUDIT_WRITER port (bound by the always
  // composed global audit module), so no static feature dependency exists.
  dependsOn: [],
  nestModule: SettingsModule,
  resourceScopes: {
    settings: "platform",
  },
  schema: { applicationSettings },
  seeders: settingsSeeders,
});
