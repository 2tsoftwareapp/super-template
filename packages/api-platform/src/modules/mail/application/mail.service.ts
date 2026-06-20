import { Injectable } from '@nestjs/common';

import type { ListMailDeliveriesQuery } from './use-cases/list-mail-deliveries.use-case';
import type { SendTemplateInput } from './use-cases/send-mail-template.use-case';

import { ListMailDeliveriesUseCase } from './use-cases/list-mail-deliveries.use-case';
import { PreviewMailTemplateUseCase } from './use-cases/preview-mail-template.use-case';
import { SendMailTemplateUseCase } from './use-cases/send-mail-template.use-case';

@Injectable()
export class MailService {
  constructor(
    private readonly sendMailTemplateUseCase: SendMailTemplateUseCase,
    private readonly previewMailTemplateUseCase: PreviewMailTemplateUseCase,
    private readonly listMailDeliveriesUseCase: ListMailDeliveriesUseCase,
  ) {}

  async sendTemplate(input: SendTemplateInput): Promise<void> {
    return this.sendMailTemplateUseCase.execute(input);
  }

  async previewTemplate(
    templateKey: string,
    variables?: Record<string, string>,
  ) {
    return this.previewMailTemplateUseCase.execute(templateKey, variables);
  }

  async listDeliveries(query: ListMailDeliveriesQuery) {
    return this.listMailDeliveriesUseCase.execute(query);
  }
}
