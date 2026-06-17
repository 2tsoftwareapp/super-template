import { Module } from '@nestjs/common';
import { MAIL_TEMPLATE_SENDER } from '@repo/api-core';

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
    {
      provide: MAIL_TEMPLATE_SENDER,
      useExisting: MailService,
    },
  ],
  exports: [MAILER, MAIL_TEMPLATE_SENDER, SmtpMailerService, MailService],
})
export class MailModule {}
