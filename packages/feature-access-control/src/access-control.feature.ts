import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { AccessControlModule } from "./access-control.module";
import { permissions, rolePermissions, roles } from "./infrastructure/persistence";
import { accessControlSeeders } from "./seed";

export const accessControlFeature: FeatureManifest = defineFeature({
  id: "access-control",
  dependsOn: ["organizations", "audit"],
  nestModule: AccessControlModule,
  resourceScopes: {
    roles: "organization",
  },
  schema: { roles, permissions, rolePermissions },
  seeders: accessControlSeeders,
});
