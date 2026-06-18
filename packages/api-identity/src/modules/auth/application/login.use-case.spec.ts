import { describe, expect, it, vi } from 'vitest';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';

import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  it('rejects invalid credentials', async () => {
    const auditWriter = { log: vi.fn() };
    const useCase = new LoginUseCase(
      {
        findByEmail: vi.fn(async () => null),
      } as never,
      {} as never,
      auditWriter as never,
      {} as never,
      {} as never,
    );

    await expect(
      useCase.execute({
        email: 'missing@test.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
    });

    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.login.failed' }),
    );
  });
});
