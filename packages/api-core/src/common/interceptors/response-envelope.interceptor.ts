import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';

import type { JsonObject } from '../types/json-value';

import { SKIP_ENVELOPE_KEY } from '../decorators/skip-envelope.decorator';

interface Envelope<T> {
  data: T;
  meta?: JsonObject;
}

function asEnvelopeIfPresent<T>(value: T): Envelope<T> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as { data?: unknown; meta?: unknown };
  const keys = Object.keys(record);

  if (
    !('data' in record) ||
    !keys.every((key) => key === 'data' || key === 'meta')
  ) {
    return null;
  }

  return value as unknown as Envelope<T>;
}

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, Envelope<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Envelope<T>> {
    const skipEnvelope = this.reflector.getAllAndOverride<boolean>(
      SKIP_ENVELOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipEnvelope) {
      return next.handle() as Observable<Envelope<T>>;
    }

    const request = context.switchToHttp().getRequest<Express.Request>();

    return next.handle().pipe(
      map((value) => {
        const envelope = asEnvelopeIfPresent(value);

        if (envelope) {
          return {
            ...envelope,
            meta: {
              ...(envelope.meta ?? {}),
              requestId: request.requestId,
            },
          };
        }

        return {
          data: value,
          meta: {
            requestId: request.requestId,
          },
        };
      }),
    );
  }
}
