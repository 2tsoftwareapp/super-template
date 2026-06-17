import { Module } from '@nestjs/common';

import { AuthRepository } from './infrastructure/auth.repository';

@Module({
  providers: [AuthRepository],
  exports: [AuthRepository],
})
export class AuthDataModule {}
