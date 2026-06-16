import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';
import { SKIP_ENVELOPE_KEY } from '../decorators/skip-envelope.decorator';

type Envelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

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
        const valueKeys =
          value && typeof value === 'object' ? Object.keys(value) : [];
        const isEnvelopeCandidate =
          value &&
          typeof value === 'object' &&
          'data' in (value as Record<string, unknown>) &&
          valueKeys.every((key) => key === 'data' || key === 'meta');

        if (isEnvelopeCandidate) {
          const envelope = value as unknown as Envelope<T>;
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
