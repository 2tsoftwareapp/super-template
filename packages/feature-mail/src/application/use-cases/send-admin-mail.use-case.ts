import type { AuthenticatedRequestUser, BackgroundJobEnqueuerWithResult } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  BACKGROUND_JOB_ENQUEUER_WITH_RESULT,
  ERROR_CODES,
  isMandatoryMailTemplate,
  SYSTEM_SCOPE,
} from "@repo/api-runtime";
import { AuditService } from "@repo/feature-audit/contracts";

import {
  TEMPLATE_RENDERER_SERVICE,
  type TemplateRendererServicePort,
} from "../ports/template-renderer.service.port";

export interface SendAdminMailCommand {
  templateKey: string;
  to: string;
  variables?: Record<string, string>;
  idempotencyKey?: string;
}

@Injectable()
export class SendAdminMailUseCase {
  constructor(
    @Inject(TEMPLATE_RENDERER_SERVICE)
    private readonly templateRenderer: TemplateRendererServicePort,
    @Inject(BACKGROUND_JOB_ENQUEUER_WITH_RESULT)
    private readonly jobEnqueuer: BackgroundJobEnqueuerWithResult,
    private readonly auditService: AuditService,
  ) {}

  async execute(actor: AuthenticatedRequestUser, command: SendAdminMailCommand) {
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
        `Missing required template variables: ${missingVariables.join(", ")}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const job = await this.jobEnqueuer.enqueueWithResult({
      type: "mail.send",
      payload: {
        templateKey: command.templateKey,
        to: command.to,
        variables,
        metadata: { requestedById: actor.userId },
      },
      createdById: actor.userId,
      organizationId: actor.organizationId ?? null,
      ...(command.idempotencyKey ? { idempotencyKey: command.idempotencyKey } : {}),
    });

    await this.auditService.log({
      actorId: actor.userId,
      action: "mail.send_requested",
      entityType: "mail_template",
      entityId: job.id,
      metadata: { templateKey: command.templateKey, to: command.to },
      scope: SYSTEM_SCOPE.PLATFORM,
    });

    return { jobId: job.id, status: job.status };
  }
}
