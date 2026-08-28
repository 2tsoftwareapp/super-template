import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";
import { UserManagementModule } from "./user-management.module";

export const userManagementFeature: FeatureManifest = defineFeature({
  id: "user-management",
  dependsOn: [
    "users",
    "organizations",
    "access-control",
    "audit",
    "activities",
    "upload",
    "outbox",
  ],
  nestModule: UserManagementModule,
});
