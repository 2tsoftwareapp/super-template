import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EnvironmentService } from '../../config/environment.service';
import { ERROR_CODES, type ErrorCode } from '../constants/error-codes';
import { AppError } from '../errors/app-error';

@Injectable()
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly environmentService: EnvironmentService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = ERROR_CODES.INTERNAL_ERROR;
    let message = 'An unexpected error occurred';
    let details: unknown = null;

    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse) {
        const body = exceptionResponse as Record<string, unknown>;
        const rawMessage = body.message;
        message = Array.isArray(rawMessage)
          ? 'Validation failed'
          : String(rawMessage ?? exception.message);
        details = Array.isArray(rawMessage) ? rawMessage : body;
        if (statusCode === HttpStatus.BAD_REQUEST) {
          code = ERROR_CODES.VALIDATION_FAILED;
        }
      }
    }

    response.locals.errorCode = code;

    console[statusCode >= 500 ? 'error' : 'warn'](
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: statusCode >= 500 ? 'error' : 'warn',
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        userId: request.user?.userId ?? null,
        errorCode: code,
        message,
        details,
        stack:
          !this.environmentService.isProduction && exception instanceof Error
            ? exception.stack
            : undefined,
      }),
    );

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
