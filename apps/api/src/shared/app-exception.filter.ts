import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

import { Catch, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";

import { AppError, ERROR_CODES } from "./errors";

/** One response shape for every failure: `{ error: { code, message } }`. */
@Injectable()
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppError) {
      response.status(exception.status).json({
        error: { code: exception.code, message: exception.message },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "object" && body !== null && "message" in body
          ? (body as { message: unknown }).message
          : exception.message;

      response.status(status).json({
        error: {
          code: status === 400 ? ERROR_CODES.VALIDATION_FAILED : ERROR_CODES.INTERNAL_ERROR,
          message: Array.isArray(message) ? message.join("; ") : String(message),
        },
      });
      return;
    }

    this.logger.error(
      "Unhandled exception",
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: "Unexpected error" },
    });
  }
}
