import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  organizationMemberRoleEnum,
  organizationMembers,
  userRoles,
  users,
  userStatusEnum,
} from "./infrastructure/persistence";
import { usersSeeders } from "./seed";
import { UsersModule } from "./users.module";

export const usersFeature: FeatureManifest = defineFeature({
  id: "users",
  dependsOn: ["access-control", "organizations", "settings", "activities", "audit", "outbox"],
  provides: ["organization-membership", "user-role-assignments", "user-credential-store"],
  requires: ["file-view"],
  nestModule: UsersModule,
  resourceScopes: {
    users: "organization",
  },
  authorization: {
    resources: {
      users: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"], defaultGrants: { "ADMIN": ["read", "create", "update", "delete"] }
      },
    },
  },
  schema: {
    users,
    userStatusEnum,
    organizationMembers,
    organizationMemberRoleEnum,
    userRoles,
  },
  seeders: usersSeeders,
});
