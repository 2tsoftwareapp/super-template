import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { applicationSettings } from "./infrastructure/persistence";
import { settingsSeeders } from "./seed";
import { SettingsModule } from "./settings.module";

export const settingsFeature: FeatureManifest = defineFeature({
  id: "settings",
  // Writes audit synchronously inside the update transaction via AUDIT_WRITER.
  dependsOn: ["audit", "access-control"],
  nestModule: SettingsModule,
  resourceScopes: {
    settings: "platform",
  },
  authorization: {
    resources: {
      settings: {
        scope: "platform",
        actions: ["read", "update"],
      },
    },
  },
  schema: { applicationSettings },
  seeders: settingsSeeders,
});
