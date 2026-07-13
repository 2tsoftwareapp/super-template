import type { AuthenticatedRequestUser } from '@repo/api-core';

import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES, isMandatoryMailTemplate } from '@repo/api-core';

import { AuditService } from '../../../audit/application/audit.service';
import { JobsService } from '../../../jobs/application/jobs.service';
import { TEMPLATE_RENDERER_SERVICE, type TemplateRendererServicePort } from '../ports/template-renderer.service.port';

export interface SendAdminMailCommand {
  templateKey: string;
  to: string;
  variables?: Record<string, string>;
  idempotencyKey?: string;
}

@Injectable()
export class SendAdminMailUseCase {
  constructor(
    @Inject(TEMPLATE_RENDERER_SERVICE) private readonly templateRenderer: TemplateRendererServicePort,
    @Inject(forwardRef(() => JobsService))
    private readonly jobsService: JobsService,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    command: SendAdminMailCommand,
  ) {
    if (isMandatoryMailTemplate(command.templateKey)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Template "${command.templateKey}" is reserved for automated security flows and cannot be sent manually`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.templateRenderer.listTemplateKeys().includes(command.templateKey)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Mail template "${command.templateKey}" was not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const variables = command.variables ?? {};
    const missingVariables = await this.templateRenderer.findMissingVariables(
      command.templateKey,
      variables,
    );

    if (missingVariables.length > 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `Missing required template variables: ${missingVariables.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const job = await this.jobsService.enqueue({
      type: 'mail.send',
      payload: {
        templateKey: command.templateKey,
        to: command.to,
        variables,
        metadata: { requestedById: actor.userId },
      },
      createdById: actor.userId,
      organizationId: actor.organizationId ?? null,
      ...(command.idempotencyKey
        ? { idempotencyKey: command.idempotencyKey }
        : {}),
    });

    await this.auditService.log({
      actorId: actor.userId,
      action: 'mail.send_requested',
      entityType: 'mail_template',
      entityId: job.id,
      metadata: { templateKey: command.templateKey, to: command.to },
    });

    return { jobId: job.id, status: job.status };
  }
}
