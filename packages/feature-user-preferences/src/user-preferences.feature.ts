import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { userPreferences } from "./infrastructure/persistence";
import { PreferencesModule } from "./preferences.module";

export const userPreferencesFeature: FeatureManifest = defineFeature({
  id: "user-preferences",
  dependsOn: ["users"],
  nestModule: PreferencesModule,
  schema: { userPreferences },
});
