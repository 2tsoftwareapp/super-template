import { Module } from '@nestjs/common';
import { AUTH_TOKEN_CLEANUP } from '@repo/api-core';

import { AuthRepository } from './infrastructure/auth.repository';

@Module({
  providers: [
    AuthRepository,
    {
      provide: AUTH_TOKEN_CLEANUP,
      useExisting: AuthRepository,
    },
  ],
  exports: [AuthRepository, AUTH_TOKEN_CLEANUP],
})
export class AuthDataModule {}
