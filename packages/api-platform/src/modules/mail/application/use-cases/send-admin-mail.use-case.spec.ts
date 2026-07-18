import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES } from '@repo/api-core';

import { SendAdminMailUseCase } from './send-admin-mail.use-case';

const actor = {
  userId: 'user-1',
  sessionId: 'session-1',
  email: 'admin@example.local',
  displayName: 'Admin',
  status: 'ACTIVE' as const,
  roles: ['ADMIN'],
  permissions: [],
  organizationId: 'org-1',
};

describe('SendAdminMailUseCase', () => {
  it('rejects mandatory security templates without touching jobs or audit', async () => {
    const templateRenderer = {
      listTemplateKeys: vi.fn(() => ['auth.welcome']),
      findMissingVariables: vi.fn(),
    };
    const jobsService = { enqueue: vi.fn() };
    const auditService = { log: vi.fn() };

    const useCase = new SendAdminMailUseCase(
      templateRenderer as never,
      jobsService as never,
      auditService as never,
    );

    await expect(
      useCase.execute(actor, {
        templateKey: 'auth.reset-password',
        to: 'user@example.test',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });

    expect(jobsService.enqueue).not.toHaveBeenCalled();
    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('rejects unknown template keys', async () => {
    const templateRenderer = {
      listTemplateKeys: vi.fn(() => ['auth.welcome']),
      findMissingVariables: vi.fn(),
    };
    const jobsService = { enqueue: vi.fn() };
    const auditService = { log: vi.fn() };

    const useCase = new SendAdminMailUseCase(
      templateRenderer as never,
      jobsService as never,
      auditService as never,
    );

    await expect(
      useCase.execute(actor, {
        templateKey: 'does.not-exist',
        to: 'user@example.test',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });
  });

  it('rejects when required template variables are missing', async () => {
    const templateRenderer = {
      listTemplateKeys: vi.fn(() => ['auth.welcome']),
      findMissingVariables: vi.fn(async () => ['displayName']),
    };
    const jobsService = { enqueue: vi.fn() };
    const auditService = { log: vi.fn() };

    const useCase = new SendAdminMailUseCase(
      templateRenderer as never,
      jobsService as never,
      auditService as never,
    );

    await expect(
      useCase.execute(actor, {
        templateKey: 'auth.welcome',
        to: 'user@example.test',
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });
    expect(jobsService.enqueue).not.toHaveBeenCalled();
  });

  it('enqueues a mail.send job and records an audit entry when valid', async () => {
    const templateRenderer = {
      listTemplateKeys: vi.fn(() => ['auth.welcome']),
      findMissingVariables: vi.fn(async () => []),
    };
    const jobsService = {
      enqueue: vi.fn(async () => ({ id: 'job-1', status: 'PENDING' })),
    };
    const auditService = { log: vi.fn(async () => undefined) };

    const useCase = new SendAdminMailUseCase(
      templateRenderer as never,
      jobsService as never,
      auditService as never,
    );

    const result = await useCase.execute(actor, {
      templateKey: 'auth.welcome',
      to: 'user@example.test',
      variables: { displayName: 'User' },
      idempotencyKey: 'key-1',
    });

    expect(jobsService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mail.send',
        organizationId: 'org-1',
        createdById: 'user-1',
        idempotencyKey: 'key-1',
        payload: expect.objectContaining({
          templateKey: 'auth.welcome',
          to: 'user@example.test',
          variables: { displayName: 'User' },
        }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'mail.send_requested',
        actorId: 'user-1',
        entityId: 'job-1',
        metadata: { templateKey: 'auth.welcome', to: 'user@example.test' },
      }),
    );
    expect(result).toEqual({ jobId: 'job-1', status: 'PENDING' });
  });
});
