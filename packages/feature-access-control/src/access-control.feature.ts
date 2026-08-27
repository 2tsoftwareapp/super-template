import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { AccessControlModule } from "./access-control.module";
import { permissions, rolePermissions, roles } from "./infrastructure/persistence";
import { accessControlSeeders } from "./seed";

export const accessControlFeature: FeatureManifest = defineFeature({
  id: "access-control",
  dependsOn: ["organizations", "audit"],
  provides: ["access-control-ops"],
  requires: ["user-role-assignments"],
  nestModule: AccessControlModule,
  resourceScopes: {
    roles: "organization",
  },
  authorization: {
    resources: {
      roles: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"], defaultGrants: { "ADMIN": ["read", "update"] }
      },
    },
  },
  schema: { roles, permissions, rolePermissions },
  seeders: accessControlSeeders,
});
