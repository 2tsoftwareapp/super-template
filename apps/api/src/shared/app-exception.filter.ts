import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

import { Catch, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";

import { AppError, ERROR_CODES, type ErrorCode } from "./errors";

/** Framework-raised HTTP errors (routing, multer, throttler) mapped onto our codes. */
const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODES.VALIDATION_FAILED,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODES.AUTH_UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ERROR_CODES.AUTH_FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ERROR_CODES.ROUTE_NOT_FOUND,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ERROR_CODES.FILE_TOO_LARGE,
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: ERROR_CODES.FILE_TYPE_NOT_ALLOWED,
  [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODES.RATE_LIMITED,
};

interface ErrorBody {
  status: number;
  code: ErrorCode;
  message: string;
}

/** One response shape for every failure: `{ error: { code, message } }`. */
@Injectable()
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, code, message } = this.toErrorBody(exception);

    host.switchToHttp().getResponse<Response>().status(status).json({ error: { code, message } });
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof AppError) {
      return { status: exception.status, code: exception.code, message: exception.message };
    }

    if (exception instanceof HttpException && exception.getStatus() < 500) {
      return fromHttpException(exception);
    }

    this.logger.error(
      "Unhandled exception",
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Unexpected error",
    };
  }
}

function fromHttpException(exception: HttpException): ErrorBody {
  const status = exception.getStatus();

  if (status === HttpStatus.NOT_FOUND) {
    return { status, code: ERROR_CODES.ROUTE_NOT_FOUND, message: "Route not found" };
  }

  if (status === HttpStatus.TOO_MANY_REQUESTS) {
    return {
      status,
      code: ERROR_CODES.RATE_LIMITED,
      message: "Too many attempts, try again later",
    };
  }

  const body = exception.getResponse();
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? body.message
      : exception.message;

  return {
    status,
    code: CODE_BY_STATUS[status] ?? ERROR_CODES.REQUEST_REJECTED,
    message: Array.isArray(message) ? message.join("; ") : String(message),
  };
}
