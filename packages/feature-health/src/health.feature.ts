import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { HealthModule } from "./health.module";

export const healthFeature: FeatureManifest = defineFeature({
  id: "health",
  dependsOn: [],
  nestModule: HealthModule,
});
