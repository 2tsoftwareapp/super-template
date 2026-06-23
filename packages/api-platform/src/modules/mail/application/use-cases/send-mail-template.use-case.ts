import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ERROR_CODES,
  isMandatoryMailTemplate,
  type JsonObject,
  USER_PREFERENCES_LOOKUP,
  type UserPreferencesLookup,
} from '@repo/api-core';

import { MailDeliveriesRepository } from '../../infrastructure/mail-deliveries.repository';
import { TemplateRendererService } from '../../infrastructure/template-renderer.service';
import { MAILER, type Mailer } from '../mailer.interface';

export interface SendTemplateInput {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  metadata?: JsonObject | null;
}

@Injectable()
export class SendMailTemplateUseCase {
  constructor(
    @Inject(MAILER) private readonly mailer: Mailer,
    private readonly templateRenderer: TemplateRendererService,
    private readonly mailDeliveriesRepository: MailDeliveriesRepository,
    @Inject(USER_PREFERENCES_LOOKUP)
    private readonly userPreferencesLookup: UserPreferencesLookup,
  ) {}

  async execute(input: SendTemplateInput): Promise<void> {
    if (!isMandatoryMailTemplate(input.templateKey)) {
      const preferences =
        await this.userPreferencesLookup.findNotificationPreferencesByEmail(
          input.to,
        );

      if (preferences && !preferences.email) {
        return;
      }
    }

    let rendered: { subject: string; text: string; html: string };

    try {
      rendered = await this.templateRenderer.render(
        input.templateKey,
        input.variables,
      );
    } catch {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Mail template "${input.templateKey}" was not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      await this.mailer.send({
        to: input.to,
        subject: rendered.subject.trim(),
        text: rendered.text.trim(),
        html: rendered.html.trim(),
      });

      await this.mailDeliveriesRepository.create({
        templateKey: input.templateKey,
        recipient: input.to,
        subject: rendered.subject.trim(),
        status: 'SENT',
        metadata: input.metadata ?? null,
        sentAt: new Date(),
      });
    } catch (error) {
      await this.mailDeliveriesRepository.create({
        templateKey: input.templateKey,
        recipient: input.to,
        subject: rendered.subject.trim(),
        status: 'FAILED',
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unknown mail delivery error',
        metadata: input.metadata ?? null,
      });

      throw error;
    }
  }
}
