import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { OrganizationManagementModule } from "./organization-management.module";

export const organizationManagementFeature: FeatureManifest = defineFeature({
  id: "organization-management",
  dependsOn: ["organizations", "access-control", "audit", "activities"],
  nestModule: OrganizationManagementModule,
});
