import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { CallHandler } from '@nestjs/common';

import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { ResponseEnvelopeInterceptor } from '../response-envelope.interceptor';

function createContext(requestId = 'req-1'): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ requestId }) }),
  } as unknown as ExecutionContext;
}

function createReflector(skip: boolean): Reflector {
  return { getAllAndOverride: () => skip } as unknown as Reflector;
}

function createNext<T>(value: T): CallHandler<T> {
  return { handle: () => of(value) } as unknown as CallHandler<T>;
}

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps a plain value in a data/meta envelope with the request id', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(createReflector(false));

    const result = await firstValueFrom(
      interceptor.intercept(createContext('req-9'), createNext({ id: 1 })),
    );

    expect(result).toEqual({
      data: { id: 1 },
      meta: { requestId: 'req-9' },
    });
  });

  it('merges the request id into an already-enveloped value', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(createReflector(false));

    const result = await firstValueFrom(
      interceptor.intercept(
        createContext('req-2'),
        createNext({ data: [1, 2], meta: { total: 2 } }),
      ),
    );

    expect(result).toEqual({
      data: [1, 2],
      meta: { total: 2, requestId: 'req-2' },
    });
  });

  it('returns the raw value untouched when the skip flag is set', async () => {
    const interceptor = new ResponseEnvelopeInterceptor(createReflector(true));

    const result = await firstValueFrom(
      interceptor.intercept(createContext(), createNext({ raw: true })),
    );

    expect(result).toEqual({ raw: true });
  });
});
