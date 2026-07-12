import type { MailTemplateSender } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { SendTemplateInput } from './use-cases/send-mail-template.use-case';

import { SendMailTemplateUseCase } from './use-cases/send-mail-template.use-case';

/**
 * Adapter implementing the MAIL_TEMPLATE_SENDER port for cross-module templated
 * mail (auth flows, job handlers). Admin read/send endpoints inject the mail use
 * cases directly instead of this facade.
 */
@Injectable()
export class MailService implements MailTemplateSender {
  constructor(
    private readonly sendMailTemplateUseCase: SendMailTemplateUseCase,
  ) {}

  async sendTemplate(input: SendTemplateInput): Promise<void> {
    await this.sendMailTemplateUseCase.execute(input);
  }
}
