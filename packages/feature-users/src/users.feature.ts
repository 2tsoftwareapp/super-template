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
  dependsOn: ["access-control", "organizations", "settings", "activities"],
  nestModule: UsersModule,
  resourceScopes: {
    users: "organization",
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
