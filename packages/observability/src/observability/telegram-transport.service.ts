import { Inject, Injectable } from "@nestjs/common";

import type { ErrorReportContext } from "./observability.types";

import { OBSERVABILITY_ENV, type ObservabilityEnvironment } from "./observability-environment";

@Injectable()
export class TelegramTransportService {
  constructor(
    @Inject(OBSERVABILITY_ENV)
    private readonly environmentService: ObservabilityEnvironment,
  ) {}

  async send(title: string, context: ErrorReportContext): Promise<void> {
    const { TELEGRAM_ERROR_BOT_TOKEN, TELEGRAM_ERROR_BOT_CHAT_ID, TELEGRAM_ERROR_BOT_TIMEOUT_MS } =
      this.environmentService.values;

    if (!TELEGRAM_ERROR_BOT_TOKEN || !TELEGRAM_ERROR_BOT_CHAT_ID) {
      return;
    }

    const text = this.buildMessage(title, context);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TELEGRAM_ERROR_BOT_TIMEOUT_MS ?? 5_000);

    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_ERROR_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_ERROR_BOT_CHAT_ID,
          text,
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      });
    } catch {
      // Telegram alerting is best-effort and must never block the main request path.
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildMessage(title: string, context: ErrorReportContext): string {
    const lines = [
      `🚨 ${title}`,
      context.errorCode ? `code: ${context.errorCode}` : null,
      context.statusCode ? `status: ${context.statusCode}` : null,
      context.requestId ? `request: ${context.requestId}` : null,
      context.method && context.path ? `route: ${context.method} ${context.path}` : null,
      context.userId ? `user: ${context.userId}` : null,
      context.details ? `details: ${this.stringifyDetails(context.details)}` : null,
      context.stack ? `stack: ${this.truncate(context.stack)}` : null,
    ].filter(Boolean);

    return this.truncate(lines.join("\n"));
  }

  private stringifyDetails(details: unknown): string {
    if (typeof details === "string") {
      return details;
    }

    try {
      return JSON.stringify(details);
    } catch {
      return "[unserializable details]";
    }
  }

  private truncate(text: string): string {
    const maxLength = 3800;

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}…`;
  }
}
