import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { OrganizationManagementModule } from "./organization-management.module";

export const organizationManagementFeature: FeatureManifest = defineFeature({
  id: "organization-management",
  dependsOn: ["organizations", "users", "access-control", "audit", "activities", "outbox"],
  nestModule: OrganizationManagementModule,
});
