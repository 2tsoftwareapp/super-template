import { Global, Module } from "@nestjs/common";
import { AUTH_TOKEN_CLEANUP } from "@repo/feature-users/contracts";
import { AUTH_EMAIL_VERIFICATION } from "@repo/feature-users/contracts";

import { AUTH_SESSION_REPOSITORY } from "./application/ports/auth-session.repository.port";
import { OUTBOX_REPOSITORY } from "./application/ports/outbox.repository.port";
import { AuthEmailVerificationService } from "./application/services/auth-email-verification.service";
import { AuthMailService } from "./application/services/auth-mail.service";
import { AuthUserStoreAdapter } from "./infrastructure/auth-user-store.adapter";
import { AuthRepository } from "./infrastructure/auth.repository";
import { OutboxRepository } from "./infrastructure/outbox.repository";
import { AUTH_USER_STORE } from "./public/auth-user-store.port";

@Global()
@Module({
  providers: [
    AuthRepository,
    AuthMailService,
    AuthEmailVerificationService,
    AuthUserStoreAdapter,
    OutboxRepository,
    {
      provide: AUTH_TOKEN_CLEANUP,
      useExisting: AuthRepository,
    },
    {
      provide: AUTH_EMAIL_VERIFICATION,
      useExisting: AuthEmailVerificationService,
    },
    {
      provide: AUTH_USER_STORE,
      useExisting: AuthUserStoreAdapter,
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useExisting: AuthRepository,
    },
    {
      provide: OUTBOX_REPOSITORY,
      useExisting: OutboxRepository,
    },
  ],
  exports: [
    AuthMailService,
    AUTH_TOKEN_CLEANUP,
    AUTH_EMAIL_VERIFICATION,
    AUTH_SESSION_REPOSITORY,
    OUTBOX_REPOSITORY,
  ],
})
export class AuthDataModule {}
