import type { NextFunction, Request, Response } from "express";

import { Inject, Injectable, type NestMiddleware } from "@nestjs/common";
import { APP_LOGGER, type AppLogger, redactRequestUrl } from "@repo/api-kernel";

type LogLevel = "info" | "warn" | "error";

/** 5xx logs as an error, 4xx as a warning, everything else as info. */
function resolveLogLevel(statusCode: number): LogLevel {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}

/** `response.locals` is untyped Express state; narrow it once, here. */
function readErrorCode(locals: Record<string, unknown>): string | null {
  return typeof locals.errorCode === "string" ? locals.errorCode : null;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(@Inject(APP_LOGGER) private readonly logger: AppLogger) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on("finish", () => {
      const level = resolveLogLevel(response.statusCode);

      const context = {
        requestId: request.requestId,
        method: request.method,
        path: redactRequestUrl(request.originalUrl),
        statusCode: response.statusCode,
        duration: Date.now() - startedAt,
        userId: request.user?.userId ?? null,
        errorCode: readErrorCode(response.locals),
      };

      if (level === "error") {
        this.logger.error("HTTP request completed", context);
        return;
      }

      if (level === "warn") {
        this.logger.warn("HTTP request completed", context);
        return;
      }

      this.logger.info("HTTP request completed", context);
    });

    next();
  }
}
