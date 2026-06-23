import { describe, expect, it, vi } from 'vitest';

import { ERROR_CODES } from '@repo/api-core';

import { ResetPreferencesUseCase } from './reset-preferences.use-case';
import { UpdatePreferencesUseCase } from './update-preferences.use-case';

describe('UpdatePreferencesUseCase', () => {
  it('rejects unsupported timezones', async () => {
    const useCase = new UpdatePreferencesUseCase(
      {
        upsert: vi.fn(),
      } as never,
      {
        log: vi.fn(),
      } as never,
    );

    await expect(
      useCase.execute('user-1', {
        theme: 'dark',
        language: 'en',
        timezone: 'Mars/Olympus',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });
  });

  it('resets preferences back to defaults', async () => {
    const repository = {
      reset: vi.fn(async () => ({
        userId: 'user-1',
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notificationPreferences: {
          email: true,
          push: true,
        },
        emailPreferences: {},
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      })),
    };
    const auditWriter = {
      log: vi.fn(async () => undefined),
    };
    const useCase = new ResetPreferencesUseCase(
      repository as never,
      auditWriter as never,
    );

    const result = await useCase.execute('user-1');

    expect(repository.reset).toHaveBeenCalledWith('user-1');
    expect(auditWriter.log).toHaveBeenCalled();
    expect(result).toMatchObject({
      userId: 'user-1',
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notificationPreferences: {
        email: true,
        push: true,
      },
    });
  });
});
