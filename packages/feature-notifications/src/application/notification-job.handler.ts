import type { JsonObject } from "@repo/api-kernel";
import type { JobHandlerContext, JobHandlerContribution } from "@repo/feature-jobs/contracts";

import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { JOB_HANDLER_REGISTRY, type JobHandlerRegistryPort } from "@repo/feature-jobs/contracts";

import { NotificationsService } from "./notifications.service";

function readStringField(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function readOptionalJsonObject(value: unknown): JsonObject | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return null;
}

/**
 * Processes the `notification.send` background job in its owning feature so
 * the jobs core stays free of notification imports.
 */
@Injectable()
export class NotificationJobHandler implements JobHandlerContribution, OnModuleInit {
  readonly type = "notification.send";

  constructor(
    private readonly notifications: NotificationsService,
    @Inject(JOB_HANDLER_REGISTRY) private readonly handlerRegistry: JobHandlerRegistryPort,
  ) {}

  onModuleInit(): void {
    this.handlerRegistry.registerHandler(this.type, (context) => this.handle(context));
  }

  async handle(context: JobHandlerContext): Promise<void> {
    const payload = context.payload as unknown as Record<string, unknown>;
    const userId = readStringField(payload, "userId");
    const type = readStringField(payload, "type");
    const title = readStringField(payload, "title");
    const body = readStringField(payload, "body");

    if (!userId || !type || !title || !body) {
      throw new Error("notification.send requires userId, type, title, and body");
    }

    await this.notifications.sendToUser(null, {
      ...(context.organizationId ? { organizationId: context.organizationId } : {}),
      userId,
      type,
      title,
      body,
      ...(readOptionalJsonObject(payload.data)
        ? { data: readOptionalJsonObject(payload.data)! }
        : {}),
      sourceBackgroundJobId: context.jobId,
    });
  }
}
