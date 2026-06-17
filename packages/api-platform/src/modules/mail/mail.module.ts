import { Module } from '@nestjs/common';

import { MailService } from './application/mail.service';
import { MAILER } from './application/mailer.interface';
import { MailDeliveriesRepository } from './infrastructure/mail-deliveries.repository';
import { SmtpMailerService } from './infrastructure/smtp-mailer.service';
import { TemplateRendererService } from './infrastructure/template-renderer.service';
import { AdminMailController } from './presentation/admin-mail.controller';

@Module({
  controllers: [AdminMailController],
  providers: [
    SmtpMailerService,
    TemplateRendererService,
    MailDeliveriesRepository,
    MailService,
    {
      provide: MAILER,
      useExisting: SmtpMailerService,
    },
  ],
  exports: [MAILER, SmtpMailerService, MailService],
})
export class MailModule {}
