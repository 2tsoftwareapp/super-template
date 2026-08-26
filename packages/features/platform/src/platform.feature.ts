import { defineFeature, type FeatureManifest } from "@repo/api-core";

import { PlatformModule } from "./platform.module";

/**
 * Platform bundles the operational capabilities (audit, mail, files,
 * attachments, jobs, notifications, activities, settings, storage, and
 * import/export). Its modules are internally cohesive and cross-reference each
 * other, so the context is composed as a single feature-plugin. Its tables stay
 * in `@repo/api-database` for now; a later step can split per-capability schema.
 */
export const platformFeature: FeatureManifest = defineFeature({
  id: "platform",
  nestModule: PlatformModule,
});
