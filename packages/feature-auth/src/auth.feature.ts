import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { AuthModule } from "./auth.module";
import {
  authSessions,
  emailVerificationTokens,
  outboxMessages,
  passwordResetTokens,
} from "./infrastructure/persistence";
import { authSeeders } from "./seed";

export const authFeature: FeatureManifest = defineFeature({
  id: "auth",
  dependsOn: ["access-control", "organizations", "mfa", "users"],
  nestModule: AuthModule,
  schema: {
    authSessions,
    emailVerificationTokens,
    passwordResetTokens,
    outboxMessages,
  },
  seeders: authSeeders,
});
