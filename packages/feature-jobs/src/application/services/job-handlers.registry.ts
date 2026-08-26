import { Inject, Injectable } from "@nestjs/common";
import {
  AUTH_TOKEN_CLEANUP,
  type AuthTokenCleanup,
  type JsonObject,
  type JsonValue,
  MAIL_TEMPLATE_SENDER,
  type MailTemplateSender,
  USER_NOTIFICATION_SENDER,
  type UserNotificationSender,
} from "@repo/api-runtime";

import type { JobHandler } from "../jobs.types";

function readStringField(payload: JsonObject, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value : "";
}

function readOptionalJsonObject(value: JsonValue | undefined): JsonObject | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value;
  }
  return null;
}

function readStringRecord(value: JsonValue | undefined): Record<string, string> {
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

@Injectable()
export class JobHandlersRegistry {
  private readonly handlers = new Map<string, JobHandler>();

  constructor(
    @Inject(MAIL_TEMPLATE_SENDER)
    private readonly mailSender: MailTemplateSender,
    @Inject(AUTH_TOKEN_CLEANUP)
    private readonly authTokenCleanup: AuthTokenCleanup,
    @Inject(USER_NOTIFICATION_SENDER)
    private readonly notificationSender: UserNotificationSender,
  ) {
    this.registerHandler("mail.send", async ({ jobId, payload }) => {
      const templateKey = readStringField(payload, "templateKey");
      const to = readStringField(payload, "to");
      const variables = readStringRecord(payload.variables);

      if (!templateKey || !to) {
        throw new Error("mail.send requires templateKey and to");
      }

      await this.mailSender.sendTemplate({
        templateKey,
        to,
        variables,
        metadata: readOptionalJsonObject(payload.metadata),
        sourceJobId: jobId,
      });
    });

    this.registerHandler("files.cleanup", async () => {
      // Stub: reserved for orphaned file cleanup.
    });

    this.registerHandler("auth.cleanup-tokens", async () => {
      await this.authTokenCleanup.cleanupExpiredTokens();
    });

    this.registerHandler("notification.send", async ({ jobId, payload, organizationId }) => {
      const userId = readStringField(payload, "userId");
      const type = readStringField(payload, "type");
      const title = readStringField(payload, "title");
      const body = readStringField(payload, "body");

      if (!userId || !type || !title || !body) {
        throw new Error("notification.send requires userId, type, title, and body");
      }

      const data = readOptionalJsonObject(payload.data);

      await this.notificationSender.sendToUser(null, {
        ...(organizationId ? { organizationId } : {}),
        userId,
        type,
        title,
        body,
        ...(data ? { data } : {}),
        sourceBackgroundJobId: jobId,
      });
    });
  }

  registerHandler(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  getHandler(type: string): JobHandler | undefined {
    return this.handlers.get(type);
  }
}
