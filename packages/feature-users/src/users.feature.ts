import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { users, userStatusEnum } from "./infrastructure/persistence";
import { UsersModule } from "./users.module";

export const usersFeature: FeatureManifest = defineFeature({
  id: "users",
  dependsOn: [],
  provides: ["user-credential-store"],
  nestModule: UsersModule,
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
});
