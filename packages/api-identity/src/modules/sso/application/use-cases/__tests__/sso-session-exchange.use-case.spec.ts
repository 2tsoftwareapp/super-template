import { describe, expect, it, vi } from 'vitest';

import { ERROR_CODES } from '@repo/api-core';

import {
  CreateSsoSessionExchangeUseCase,
  ExchangeSsoSessionUseCase,
} from '../sso-session-exchange.use-case';

describe('Sso session exchange use cases', () => {
  it('creates a one-time exchange code for a session', async () => {
    const ssoRepository = {
      createSessionExchange: vi.fn(async () => ({ id: 'exchange-1' })),
    };
    const useCase = new CreateSsoSessionExchangeUseCase(ssoRepository as never);

    const result = await useCase.execute({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      organizationId: 'org-1',
    });

    expect(result.exchangeCode).toEqual(expect.any(String));
    expect(ssoRepository.createSessionExchange).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        organizationId: 'org-1',
      }),
    );
  });

  it('exchanges a valid code once and rejects replay', async () => {
    const ssoRepository = {
      findValidSessionExchangeByCodeHash: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'exchange-1',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          organizationId: 'org-1',
        })
        .mockResolvedValueOnce(null),
      consumeSessionExchange: vi.fn(async () => undefined),
    };
    const useCase = new ExchangeSsoSessionUseCase(ssoRepository as never);

    const first = await useCase.execute('exchange-code');
    expect(first).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      organizationId: 'org-1',
    });
    expect(ssoRepository.consumeSessionExchange).toHaveBeenCalledWith(
      'exchange-1',
    );

    await expect(useCase.execute('exchange-code')).rejects.toMatchObject({
      code: ERROR_CODES.SSO_EXCHANGE_INVALID,
    });
  });
});
