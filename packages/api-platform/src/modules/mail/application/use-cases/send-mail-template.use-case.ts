import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ERROR_CODES,
  isMandatoryMailTemplate,
  type JsonObject,
  USER_PREFERENCES_LOOKUP,
  type UserPreferencesLookup,
} from '@repo/api-core';

import { MAILER, type Mailer } from '../mailer.interface';
import { MAIL_DELIVERIES_REPOSITORY, type MailDeliveriesRepositoryPort } from '../ports/mail-deliveries.repository.port';
import { TEMPLATE_RENDERER_SERVICE, type TemplateRendererServicePort } from '../ports/template-renderer.service.port';

export interface SendTemplateInput {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  metadata?: JsonObject | null;
  sourceJobId?: string | null;
}

@Injectable()
export class SendMailTemplateUseCase {
  constructor(
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(TEMPLATE_RENDERER_SERVICE) private readonly templateRenderer: TemplateRendererServicePort,
    @Inject(MAIL_DELIVERIES_REPOSITORY) private readonly mailDeliveriesRepository: MailDeliveriesRepositoryPort,
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

    const delivery = await this.mailDeliveriesRepository.create({
      templateKey: input.templateKey,
      recipient: input.to,
      subject: rendered.subject.trim(),
      status: 'PENDING',
      errorMessage: null,
      metadata: input.metadata ?? null,
      sourceJobId: input.sourceJobId ?? null,
    });

    // Idempotent mail state machine (H-001):
    //   PENDING → PROCESSING → SENT
    //                    ↘ FAILED
    //   FAILED → PROCESSING (retry, via reclaimForRetry)
    // On insert conflict the row already exists for this (sourceJobId, recipient).
    // - SENT  → already delivered, nothing to do.
    // - FAILED/stale PROCESSING with expired lease → reclaim to PENDING and retry.
    let target = delivery;
    if (!target && input.sourceJobId) {
      const existing = await this.mailDeliveriesRepository.findBySourceJobId(input.sourceJobId, input.to);
      if (existing?.status === 'SENT') {
        return;
      }
      target = await this.mailDeliveriesRepository.reclaimForRetry(input.sourceJobId, input.to);
    }

    if (!target) {
      throw new Error('Mail delivery already attempted but not confirmed sent');
    }

    // Atomically claim the PENDING row for this worker. Returns null if
    // another worker already claimed it (status is no longer PENDING).
    const claimed = await this.mailDeliveriesRepository.claimForProcessing(target.id);
    if (!claimed || claimed.status !== 'PROCESSING') {
      return;
    }

    try {
      await this.mailer.send({
        to: input.to,
        subject: rendered.subject.trim(),
        text: rendered.text.trim(),
        html: rendered.html.trim(),
      });

      try {
        await this.mailDeliveriesRepository.updateStatus(
          claimed.id,
          claimed.claimToken!,
          { status: 'SENT', sentAt: new Date(), errorMessage: null },
        );
      } catch (statusError) {
        // SMTP already sent the email. If the DB update is fenced because
        // another worker reclaimed our lease, the external side effect
        // already happened — do NOT throw so the job is not retried.
        // If the error is *not* a stale worker (e.g. connection error),
        // still throw so the job can retry (the email was likely sent but
        // the caller should decide; we err on the side of not duplicating).
        if (statusError instanceof Error && statusError.message.includes('Stale worker')) {
          return;
        }
        throw statusError;
      }
    } catch (error) {
      // SMTP failed (or a non-stale DB error after send). Mark FAILED.
      try {
        await this.mailDeliveriesRepository.updateStatus(
          claimed.id,
          claimed.claimToken!,
          {
            status: 'FAILED',
            errorMessage:
              error instanceof Error
                ? error.message
                : 'Unknown mail delivery error',
          },
        );
      } catch (statusError) {
        // Even marking FAILED can be stale-fenced if the lease expired
        // between the SMTP failure and this catch. Swallow — the reclaiming
        // worker owns this row now.
        if (statusError instanceof Error && statusError.message.includes('Stale worker')) {
          return;
        }
      }

      throw error;
    }
  }
}