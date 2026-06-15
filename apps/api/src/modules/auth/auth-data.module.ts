import { Module } from '@nestjs/common';
import { MAILER } from './application/mailer.interface';
import { AuthRepository } from './infrastructure/auth.repository';
import { SmtpMailerService } from './infrastructure/smtp-mailer.service';

@Module({
  providers: [
    AuthRepository,
    SmtpMailerService,
    {
      provide: MAILER,
      useExisting: SmtpMailerService,
    },
  ],
  exports: [AuthRepository, MAILER],
})
export class AuthDataModule {}
