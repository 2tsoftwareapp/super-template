import { Injectable } from "@nestjs/common";

import type { ErrorReportContext } from "./observability.types";

import { SentryTransportService } from "./sentry-transport.service";
import { TelegramTransportService } from "./telegram-transport.service";

@Injectable()
export class ErrorReporterService {
  constructor(
    private readonly sentryTransport: SentryTransportService,
    private readonly telegramTransport: TelegramTransportService,
  ) {}

  reportException(error: Error, context: ErrorReportContext): void {
    this.sentryTransport.captureException(error, context);
    void this.telegramTransport.send(error.message || "Unhandled error", context);
  }

  reportMessage(message: string, context: ErrorReportContext): void {
    this.sentryTransport.captureMessage(message, context);
    void this.telegramTransport.send(message, context);
  }
}
