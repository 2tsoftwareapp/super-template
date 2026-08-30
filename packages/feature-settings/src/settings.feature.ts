import { APP_GUARD } from "@nestjs/core";
import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { applicationSettings } from "./infrastructure/persistence";
import { MaintenanceModeGuard } from "./maintenance-mode.guard";
import { settingsSeeders } from "./seed";
import { SettingsModule } from "./settings.module";

export const settingsFeature: FeatureManifest = defineFeature({
  id: "settings",
  // Writes audit synchronously inside the update transaction via AUDIT_WRITER.
  dependsOn: ["audit"],
  nestModule: SettingsModule,
  httpPipeline: {
    guards: [
      {
        provide: APP_GUARD,
        useClass: MaintenanceModeGuard,
      },
    ],
  },
  httpPipelineOrder: 10,
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
