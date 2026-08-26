import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { users, userStatusEnum } from "./infrastructure/persistence";
import { UsersModule } from "./users.module";

export const usersFeature: FeatureManifest = defineFeature({
  id: "users",
  dependsOn: ["access-control", "organizations"],
  nestModule: UsersModule,
  schema: { users, userStatusEnum },
});
