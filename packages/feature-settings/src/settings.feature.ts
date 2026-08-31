import { APP_GUARD } from "@nestjs/core";
import { defineFeature } from "@repo/api-plugin-kit";

import { applicationSettings } from "./infrastructure/persistence";
import { MaintenanceModeGuard } from "./maintenance-mode.guard";
import { APPLICATION_SETTINGS_LOOKUP, type ApplicationSettingsLookup } from "./public/contracts";
import { settingsSeeders } from "./seed";
import { SettingsModule } from "./settings.module";

export const settingsFeature = defineFeature({
  id: "settings",
  // Writes audit synchronously inside the update transaction via AUDIT_WRITER.
  dependsOn: ["audit"],
  nestModule: SettingsModule,
  httpPipeline: {
    guards: [
      {
        provide: APP_GUARD,
        useFactory: (applicationSettingsLookup: ApplicationSettingsLookup) =>
          new MaintenanceModeGuard(applicationSettingsLookup),
        inject: [APPLICATION_SETTINGS_LOOKUP],
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
