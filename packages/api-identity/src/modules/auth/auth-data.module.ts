import { Module } from '@nestjs/common';
import { AUTH_TOKEN_CLEANUP } from '@repo/api-core';

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
  ],
  exports: [AuthRepository, AuthMailService, AUTH_TOKEN_CLEANUP],
})
export class AuthDataModule {}
