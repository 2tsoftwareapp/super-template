import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

type Envelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, Envelope<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Envelope<T>> {
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
