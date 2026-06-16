import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = request.header('x-request-id') ?? randomUUID();

    request.requestId = requestId;
    request.requestContext = {
      requestId,
      ipAddress: request.ip,
      userAgent: request.header('user-agent') ?? undefined,
    };

    response.setHeader('x-request-id', requestId);
    next();
  }
}
