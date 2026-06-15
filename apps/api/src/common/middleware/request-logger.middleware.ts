import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on('finish', () => {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level:
            response.statusCode >= 500
              ? 'error'
              : response.statusCode >= 400
                ? 'warn'
                : 'info',
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          duration: Date.now() - startedAt,
          userId: request.user?.userId ?? null,
          errorCode: response.locals.errorCode ?? null,
        }),
      );
    });

    next();
  }
}
