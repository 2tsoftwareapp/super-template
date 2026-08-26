import { defineFeature, type FeatureManifest } from "@repo/api-core";

import { HealthModule } from "./health.module";

/**
 * Health is the minimal feature-plugin exemplar: a fully self-contained vertical
 * slice (presentation + application) that depends only on kernel packages and
 * contributes no schema. The application composes it by adding this manifest to
 * its feature list; removing the manifest (and the workspace dependency) removes
 * the `/health` capability without touching any kernel code.
 */
export const healthFeature: FeatureManifest = defineFeature({
  id: "health",
  nestModule: HealthModule,
});
