import type { Request, Response } from "express";

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import {
  APP_LOGGER,
  AppError,
  type AppLogger,
  type JsonObject,
  type JsonValue,
} from "@repo/api-kernel";
import {
  type ErrorReportContext,
  ErrorReporterService,
} from "@repo/observability";

import { EnvironmentService } from "../config/environment";
import { ERROR_CODES } from "../error-codes";

function toLogDetails(value: unknown): JsonValue | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return null;
  }
}

interface ExceptionContextBase {
  errorCode: string;
  method: string;
  path: string;
  requestId?: string;
  stack?: string;
  statusCode: number;
  userId: string | null;
}

function buildExceptionContextBase(input: {
  code: string;
  environmentService: EnvironmentService;
  exception: unknown;
  request: Request;
  statusCode: number;
}): ExceptionContextBase {
  const { code, environmentService, exception, request, statusCode } = input;

  return {
    requestId: request.requestId,
    method: request.method,
    path: request.originalUrl,
    statusCode,
    userId: request.user?.userId ?? null,
    errorCode: code,
    ...(!environmentService.isProduction && exception instanceof Error && exception.stack
      ? { stack: exception.stack }
      : {}),
  };
}

@Injectable()
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly environmentService: EnvironmentService,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    private readonly errorReporter: ErrorReporterService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    // Default to a generic 500 so unexpected exceptions never leak an untyped response.
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ERROR_CODES.INTERNAL_ERROR;
    let message = "An unexpected error occurred";
    let details: unknown = null;

    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object" && exceptionResponse) {
        const body = exceptionResponse as Record<string, unknown>;
        const rawMessage = body.message;
        message = Array.isArray(rawMessage)
          ? "Validation failed"
          : typeof rawMessage === "string"
            ? rawMessage
            : exception.message;
        details = Array.isArray(rawMessage) ? rawMessage : body;
        if (statusCode === HttpStatus.BAD_REQUEST) {
          code = ERROR_CODES.VALIDATION_FAILED;
        }
      }
    }

    // Persist the resolved code for downstream logging/middleware that runs after the exception handler.
    response.locals.errorCode = code;

    const contextBase = buildExceptionContextBase({
      code,
      environmentService: this.environmentService,
      exception,
      request,
      statusCode,
    });

    const reportContext: ErrorReportContext = {
      ...contextBase,
      details,
    };

    const logContext: JsonObject = {
      ...contextBase,
      details: toLogDetails(details),
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error("Unhandled request exception", logContext);
      if (exception instanceof Error) {
        this.errorReporter.reportException(exception, reportContext);
      } else {
        this.errorReporter.reportMessage("Unhandled non-error exception", reportContext);
      }
    } else {
      this.logger.warn("Handled request exception", logContext);
    }

    // A streamed response (e.g. SSE) may have already flushed headers; writing a
    // JSON body here would throw ERR_HTTP_HEADERS_SENT. The error is already logged
    // and reported above, so just stop.
    if (response.headersSent) {
      return;
    }

    response.status(statusCode).json({
      error: {
        code,
        message,
        details,
      },
      meta: {
        requestId: request.requestId,
      },
    });
  }
}
