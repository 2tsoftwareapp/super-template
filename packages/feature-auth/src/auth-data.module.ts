import { Module } from "@nestjs/common";
import { UsersModule } from "@repo/feature-users/module";

import { AUTH_SESSION_REPOSITORY } from "./application/ports/auth-session.repository.port";
import { AuthEmailVerificationService } from "./application/services/auth-email-verification.service";
import { AuthMailService } from "./application/services/auth-mail.service";
import {
  AUTH_TOKEN_CLEANUP_JOB_HANDLER_PROVIDER,
  AuthTokenCleanupJobHandler,
} from "./application/services/auth-token-cleanup-job.handler";
import {
  AUTH_USER_LIFECYCLE_HANDLER_PROVIDERS,
  AuthUserLifecycleHandlers,
} from "./application/services/auth-user-lifecycle.handlers";
import { AuthUserStoreAdapter } from "./infrastructure/auth-user-store.adapter";
import { AuthRepository } from "./infrastructure/auth.repository";
import { AUTH_TOKEN_MAINTENANCE } from "./public/auth-token-maintenance.port";
import { AUTH_USER_STORE } from "./public/auth-user-store.port";

@Module({
  imports: [UsersModule],
  providers: [
    AuthRepository,
    AuthMailService,
    AuthEmailVerificationService,
    AuthUserStoreAdapter,
    {
      provide: AUTH_USER_STORE,
      useExisting: AuthUserStoreAdapter,
    },
    {
      provide: AUTH_TOKEN_MAINTENANCE,
      useExisting: AuthRepository,
    },
    AuthTokenCleanupJobHandler,
    AUTH_TOKEN_CLEANUP_JOB_HANDLER_PROVIDER,
    AuthUserLifecycleHandlers,
    ...AUTH_USER_LIFECYCLE_HANDLER_PROVIDERS,
    {
      provide: AUTH_SESSION_REPOSITORY,
      useExisting: AuthRepository,
    },
  ],
  exports: [AuthMailService, AUTH_SESSION_REPOSITORY, AUTH_USER_STORE],
})
export class AuthDataModule {}
