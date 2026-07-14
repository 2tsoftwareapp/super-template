import { Module } from '@nestjs/common';
import { AUTH_TOKEN_CLEANUP } from '@repo/api-core';

import { AUTH_SESSION_REPOSITORY } from './application/ports/auth-session.repository.port';
import { AuthMailService } from './application/services/auth-mail.service';
import { AuthRepository } from './infrastructure/auth.repository';

@Module({
  providers: [
    AuthRepository,
    AuthMailService,
    {
      provide: AUTH_TOKEN_CLEANUP,
      useExisting: AuthRepository,
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useExisting: AuthRepository,
    },
  ],
  exports: [AuthMailService, AUTH_TOKEN_CLEANUP, AUTH_SESSION_REPOSITORY],
})
export class AuthDataModule {}
