import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { users, userStatusEnum } from "./infrastructure/persistence";
import { usersSeeders } from "./seed";
import { UsersModule } from "./users.module";

export const usersFeature: FeatureManifest = defineFeature({
  id: "users",
  dependsOn: ["settings", "activities", "audit", "outbox", ],
  provides: ["user-credential-store"],
  nestModule: UsersModule,
  resourceScopes: {
    users: "organization",
  },
  authorization: {
    resources: {
      users: {
        scope: "organization",
        actions: ["read", "create", "update", "delete"],
        defaultGrants: { ADMIN: ["read", "create", "update", "delete"] },
      },
    },
  },
  schema: {
    users,
    userStatusEnum,
  },
  seeders: usersSeeders,
});
