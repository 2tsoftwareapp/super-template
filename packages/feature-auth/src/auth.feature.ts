import { APP_GUARD, Reflector } from "@nestjs/core";
import { defineFeature } from "@repo/api-plugin-kit";
import { EnvironmentService } from "@repo/api-runtime";

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
import { ACCESS_TOKEN_AUTHENTICATOR, type AccessTokenAuthenticator } from "./public/contracts";
import { authSeeders } from "./seed";

export const authFeature = defineFeature({
  id: "auth",
  dependsOn: [
    "access-control",
    "organizations",
    "organization-management",
    "mfa",
    "users",
    "settings",
    "audit",
    "outbox",
  ],
  nestModule: AuthModule,
  httpPipeline: {
    guards: [
      {
        provide: APP_GUARD,
        useFactory: (
          reflector: Reflector,
          accessTokenAuthenticator: AccessTokenAuthenticator,
          environmentService: EnvironmentService,
        ) => new AuthGuard(reflector, accessTokenAuthenticator, environmentService),
        inject: [Reflector, ACCESS_TOKEN_AUTHENTICATOR, EnvironmentService],
      },
    ],
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
