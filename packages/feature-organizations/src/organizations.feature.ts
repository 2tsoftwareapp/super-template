import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { organizations } from "./infrastructure/persistence";
import { OrganizationsModule } from "./organizations.module";

export const organizationsFeature: FeatureManifest = defineFeature({
  id: "organizations",
  dependsOn: ["activities", "audit"],
  nestModule: OrganizationsModule,
  schema: { organizations },
});
