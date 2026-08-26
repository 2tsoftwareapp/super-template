import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import {
  AppError,
  ERROR_CODES,
  isMandatoryMailTemplate,
  type JsonObject,
  USER_PREFERENCES_LOOKUP,
  type UserPreferencesLookup,
} from "@repo/api-runtime";

import {
  MAIL_DELIVERIES_REPOSITORY,
  type MailDeliveriesRepositoryPort,
} from "../ports/mail-deliveries.repository.port";
import { MAILER, type Mailer } from "../ports/mailer.interface";
import {
  TEMPLATE_RENDERER_SERVICE,
  type TemplateRendererServicePort,
} from "../ports/template-renderer.service.port";

export interface SendTemplateInput {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  metadata?: JsonObject | null;
  sourceJobId?: string | null;
}

@Injectable()
export class SendMailTemplateUseCase {
  private readonly logger = new Logger(SendMailTemplateUseCase.name);

  constructor(
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(TEMPLATE_RENDERER_SERVICE)
    private readonly templateRenderer: TemplateRendererServicePort,
    @Inject(MAIL_DELIVERIES_REPOSITORY)
    private readonly mailDeliveriesRepository: MailDeliveriesRepositoryPort,
    @Inject(USER_PREFERENCES_LOOKUP)
    private readonly userPreferencesLookup: UserPreferencesLookup,
  ) {}

  async execute(input: SendTemplateInput): Promise<void> {
    if (!isMandatoryMailTemplate(input.templateKey)) {
      const preferences = await this.userPreferencesLookup.findNotificationPreferencesByEmail(
        input.to,
      );

      if (preferences && !preferences.email) {
        return;
      }
    }

    let rendered: { subject: string; text: string; html: string };

    try {
      rendered = await this.templateRenderer.render(input.templateKey, input.variables);
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
      status: "PENDING",
      errorMessage: null,
      metadata: input.metadata ?? null,
      sourceJobId: input.sourceJobId ?? null,
    });

    // Idempotent mail state machine (H-001):
    //   PENDING → PROCESSING ──→ SENT
    //                    ├──→ PROVIDER_ACCEPTED (escape hatch when fenced SENT fails)
    //                    ↘ FAILED
    //   FAILED → PROCESSING (retry, via reclaimForRetry)
    // On insert conflict the row already exists for this (sourceJobId, recipient).
    // - SENT / PROVIDER_ACCEPTED → already delivered, nothing to do.
    // - FAILED/stale PROCESSING with expired lease → reclaim to PENDING and retry.
    let target = delivery;
    if (!target && input.sourceJobId) {
      const existing = await this.mailDeliveriesRepository.findBySourceJobId(
        input.sourceJobId,
        input.to,
      );
      if (existing?.status === "SENT" || existing?.status === "PROVIDER_ACCEPTED") {
        return;
      }
      target = await this.mailDeliveriesRepository.reclaimForRetry(input.sourceJobId, input.to);
    }

    if (!target) {
      throw new Error("Mail delivery already attempted but not confirmed sent");
    }

    // Atomically claim the PENDING row for this worker. Returns null if
    // another worker already claimed it (status is no longer PENDING).
    const claimed = await this.mailDeliveriesRepository.claimForProcessing(target.id);
    if (claimed?.status !== "PROCESSING") {
      return;
    }

    // Provider idempotency key: deterministic from delivery ID so the same
    // Message-ID is generated on retry, allowing SMTP servers to deduplicate.
    const providerMessageId = `mail-${claimed.id}`;

    try {
      await this.mailer.send({
        to: input.to,
        subject: rendered.subject.trim(),
        text: rendered.text.trim(),
        html: rendered.html.trim(),
        messageId: providerMessageId,
      });

      try {
        await this.mailDeliveriesRepository.updateStatus(claimed.id, claimed.claimToken!, {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
          providerMessageId,
        });
      } catch (statusError) {
        // SMTP already accepted the email. The fenced updateStatus(SENT)
        // failed (stale worker, connection drop, etc.). Try the unfenced
        // escape hatch to persist PROVIDER_ACCEPTED so the row is terminal
        // and never auto-retried (H-001).
        try {
          await this.mailDeliveriesRepository.markProviderAccepted(claimed.id, providerMessageId);
        } catch (hatchError) {
          // Both fenced and unfenced updates failed. Window for duplicate
          // sends on worker crash is now extremely narrow but unavoidable.
          this.logger.warn(
            `Mail sent but both fenced and unfenced status updates failed: fenced=${statusError instanceof Error ? statusError.message : String(statusError)} unfenced=${hatchError instanceof Error ? hatchError.message : String(hatchError)}`,
          );
          return;
        }
        this.logger.warn(
          `Mail sent but fenced updateStatus(SENT) failed; marked PROVIDER_ACCEPTED: ${statusError instanceof Error ? statusError.message : String(statusError)}`,
        );
        return;
      }
    } catch (error) {
      // SMTP rejected the email. Safe to mark FAILED and retry.
      try {
        await this.mailDeliveriesRepository.updateStatus(claimed.id, claimed.claimToken!, {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown mail delivery error",
          providerMessageId,
        });
      } catch (statusError) {
        this.logger.warn(
          `Mail FAILED but DB update also failed: ${statusError instanceof Error ? statusError.message : String(statusError)}`,
        );
      }

      throw error;
    }
  }
}
