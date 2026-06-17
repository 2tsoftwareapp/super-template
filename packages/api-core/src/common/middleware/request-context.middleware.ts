import type { NextFunction, Request, Response } from 'express';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

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
