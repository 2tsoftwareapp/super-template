import { forwardRef, Module } from '@nestjs/common';
import { MAIL_TEMPLATE_SENDER } from '@repo/api-core';

import { JobsModule } from '../jobs/jobs.module';
import { MailService } from './application/mail.service';
import { MAILER } from './application/mailer.interface';
import { MAIL_DELIVERIES_REPOSITORY } from './application/ports/mail-deliveries.repository.port';
import { TEMPLATE_RENDERER_SERVICE } from './application/ports/template-renderer.service.port';
import { ListMailDeliveriesUseCase } from './application/use-cases/list-mail-deliveries.use-case';
import { ListMailTemplatesUseCase } from './application/use-cases/list-mail-templates.use-case';
import { PreviewMailTemplateUseCase } from './application/use-cases/preview-mail-template.use-case';
import { SendAdminMailUseCase } from './application/use-cases/send-admin-mail.use-case';
import { SendMailTemplateUseCase } from './application/use-cases/send-mail-template.use-case';
import { MailDeliveriesRepository } from './infrastructure/mail-deliveries.repository';
import { SmtpMailerService } from './infrastructure/smtp-mailer.service';
import { TemplateRendererService } from './infrastructure/template-renderer.service';
import { AdminMailController } from './presentation/admin-mail.controller';

@Module({
  imports: [forwardRef(() => JobsModule)],
  controllers: [AdminMailController],
  providers: [
    SmtpMailerService,
    TemplateRendererService,
    MailDeliveriesRepository,
    {
      provide: MAIL_DELIVERIES_REPOSITORY,
      useExisting: MailDeliveriesRepository,
    },
    {
      provide: TEMPLATE_RENDERER_SERVICE,
      useExisting: TemplateRendererService,
    },
    SendMailTemplateUseCase,
    PreviewMailTemplateUseCase,
    ListMailDeliveriesUseCase,
    ListMailTemplatesUseCase,
    SendAdminMailUseCase,
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
  exports: [MAILER, MAIL_TEMPLATE_SENDER, MAIL_DELIVERIES_REPOSITORY, TEMPLATE_RENDERER_SERVICE, MailService],
})
export class MailModule {}
