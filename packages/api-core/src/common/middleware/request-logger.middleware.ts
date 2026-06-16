import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { APP_LOGGER, type AppLogger } from '../logging/logger.interface';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(@Inject(APP_LOGGER) private readonly logger: AppLogger) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on('finish', () => {
      const level =
        response.statusCode >= 500
          ? 'error'
          : response.statusCode >= 400
            ? 'warn'
            : 'info';

      const context = {
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        duration: Date.now() - startedAt,
        userId: request.user?.userId ?? null,
        errorCode: response.locals.errorCode ?? null,
      };

      if (level === 'error') {
        this.logger.error('HTTP request completed', context);
        return;
      }

      if (level === 'warn') {
        this.logger.warn('HTTP request completed', context);
        return;
      }

      this.logger.info('HTTP request completed', context);
    });

    next();
  }
}
