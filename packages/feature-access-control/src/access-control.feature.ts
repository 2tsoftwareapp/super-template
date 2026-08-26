import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { AccessControlModule } from "./access-control.module";
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from "./infrastructure/persistence";

export const accessControlFeature: FeatureManifest = defineFeature({
  id: "access-control",
  dependsOn: [],
  nestModule: AccessControlModule,
  schema: { roles, permissions, userRoles, rolePermissions },
});
