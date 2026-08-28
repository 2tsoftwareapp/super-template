import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { AccessControlModule } from "./access-control.module";
import { permissions, rolePermissions, roles, userRoles } from "./infrastructure/persistence";
import { accessControlSeeders } from "./seed";

export const accessControlFeature: FeatureManifest = defineFeature({
  id: "access-control",
  dependsOn: ["users", "organizations", "audit"],
  provides: ["access-control-ops"],
  nestModule: AccessControlModule,
  authorization: {
    resources: {
      roles: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"],
        defaultGrants: { ADMIN: ["read", "update"] },
      },
    },
  },
  schema: { roles, permissions, rolePermissions, userRoles },
  seeders: accessControlSeeders,
});
