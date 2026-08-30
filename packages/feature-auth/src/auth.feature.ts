import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import {
  AuthSendVerificationEmailHandler,
  UserLifecycleCreatedHandler,
  UserLifecycleDeletedHandler,
  UserLifecyclePasswordChangedHandler,
  UserLifecycleStatusBlockedHandler,
} from "./application/services/auth-user-lifecycle.handlers";
import { AuthGuard } from "./auth.guard";
import { AuthModule } from "./auth.module";
import {
  authSessions,
  emailVerificationTokens,
  passwordResetTokens,
} from "./infrastructure/persistence";
import { authSeeders } from "./seed";

export const authFeature: FeatureManifest = defineFeature({
  id: "auth",
  dependsOn: [
    "access-control",
    "organizations",
    "organization-management",
    "mfa",
    "users",
    "settings",
    "audit",
    "jobs",
    "mail",
    "outbox",
  ],
  nestModule: AuthModule,
  httpPipeline: {
    guards: [AuthGuard],
  },
  httpPipelineOrder: 20,
  schema: {
    authSessions,
    emailVerificationTokens,
    passwordResetTokens,
  },
  seeders: authSeeders,
  outboxHandlers: [
    AuthSendVerificationEmailHandler,
    UserLifecycleCreatedHandler,
    UserLifecycleDeletedHandler,
    UserLifecyclePasswordChangedHandler,
    UserLifecycleStatusBlockedHandler,
  ],
});
