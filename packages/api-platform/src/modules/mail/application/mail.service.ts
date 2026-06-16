import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core/common/constants/error-codes';
import { AppError } from '@repo/api-core/common/errors/app-error';
import { MailDeliveriesRepository } from '../infrastructure/mail-deliveries.repository';
import { TemplateRendererService } from '../infrastructure/template-renderer.service';
import { MAILER, type Mailer } from './mailer.interface';

type SendTemplateInput = {
  templateKey: string;
  to: string;
  variables: Record<string, string>;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class MailService {
  constructor(
    @Inject(MAILER) private readonly mailer: Mailer,
    private readonly templateRenderer: TemplateRendererService,
    private readonly mailDeliveriesRepository: MailDeliveriesRepository,
  ) {}

  async sendTemplate(input: SendTemplateInput): Promise<void> {
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

  async previewTemplate(
    templateKey: string,
    variables?: Record<string, string>,
  ) {
    try {
      return this.templateRenderer.preview(templateKey, variables);
    } catch {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Mail template "${templateKey}" was not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async listDeliveries(query: {
    page: number;
    limit: number;
    templateKey?: string;
    status?: 'SENT' | 'FAILED';
  }) {
    const result = await this.mailDeliveriesRepository.list({
      page: query.page,
      limit: query.limit,
      ...(query.templateKey !== undefined
        ? { templateKey: query.templateKey }
        : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });

    return {
      rows: result.rows.map((row) => ({
        id: row.id,
        templateKey: row.templateKey,
        recipient: row.recipient,
        subject: row.subject,
        status: row.status,
        errorMessage: row.errorMessage ?? null,
        metadata: row.metadata ?? null,
        sentAt: row.sentAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      total: result.total,
    };
  }
}
