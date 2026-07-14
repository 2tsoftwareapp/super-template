import { Module } from '@nestjs/common';
import { AUTH_TOKEN_CLEANUP } from '@repo/api-core';

import { AUTH_SESSION_REPOSITORY } from './application/ports/auth-session.repository.port';
import { OUTBOX_REPOSITORY } from './application/ports/outbox.repository.port';
import { AuthMailService } from './application/services/auth-mail.service';
import { AuthRepository } from './infrastructure/auth.repository';
import { OutboxRepository } from './infrastructure/outbox.repository';

@Module({
  providers: [
    AuthRepository,
    AuthMailService,
    OutboxRepository,
    {
      provide: AUTH_TOKEN_CLEANUP,
      useExisting: AuthRepository,
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
  exports: [AuthMailService, AUTH_TOKEN_CLEANUP, AUTH_SESSION_REPOSITORY, OUTBOX_REPOSITORY],
})
export class AuthDataModule {}
