import type { JsonObject } from "@repo/api-kernel";
import type { JobHandlerContext, JobHandlerContribution } from "@repo/feature-jobs/contracts";

import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { JOB_HANDLER_REGISTRY, type JobHandlerRegistryPort } from "@repo/feature-jobs/contracts";

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
export class MailJobHandler implements JobHandlerContribution, OnModuleInit {
  readonly type = "mail.send";

  constructor(
    private readonly mailService: MailService,
    @Inject(JOB_HANDLER_REGISTRY) private readonly handlerRegistry: JobHandlerRegistryPort,
  ) {}

  onModuleInit(): void {
    this.handlerRegistry.registerHandler(this.type, (context) => this.handle(context));
  }

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
