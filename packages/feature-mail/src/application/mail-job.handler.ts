import type { JobHandlerContribution, JobHandlerContext } from "@repo/feature-jobs/contracts";

import { Injectable } from "@nestjs/common";
import type { JsonObject } from "@repo/api-kernel";
import { JOB_HANDLER } from "@repo/feature-jobs/contracts";

import type { SendTemplateInput } from "./use-cases/send-mail-template.use-case";
import { MailService } from "./mail.service";

function readStringField(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function readStringRecord(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      result[key] = entry;
    }
  }
  return result;
}

function readOptionalJsonObject(value: unknown): JsonObject | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return null;
}

/**
 * Processes the `mail.send` background job. Lives in feature-mail so the jobs
 * core never imports a concrete mailer.
 */
@Injectable()
export class MailJobHandler implements JobHandlerContribution {
  readonly type = "mail.send";

  constructor(private readonly mailService: MailService) {}

  async handle(context: JobHandlerContext): Promise<void> {
    const payload = context.payload as unknown as Record<string, unknown>;
    const templateKey = readStringField(payload, "templateKey");
    const to = readStringField(payload, "to");

    if (!templateKey || !to) {
      throw new Error("mail.send requires templateKey and to");
    }

    const input: SendTemplateInput = {
      templateKey,
      to,
      variables: readStringRecord(payload.variables),
      metadata: readOptionalJsonObject(payload.metadata),
      sourceJobId: context.jobId,
    };
    await this.mailService.sendTemplate(input);
  }
}

export const MAIL_JOB_HANDLER_PROVIDER = {
  provide: JOB_HANDLER,
  useFactory: (handler: MailJobHandler) => handler,
  inject: [MailJobHandler],
  multi: true,
};
