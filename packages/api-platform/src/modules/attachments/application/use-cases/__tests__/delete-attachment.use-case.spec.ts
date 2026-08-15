import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedRequestUser } from '@repo/api-core';

import { ERROR_CODES } from '@repo/api-core';

import { DeleteAttachmentUseCase } from '../delete-attachment.use-case';

const actor = {
  userId: 'user-1',
  organizationId: 'org-1',
} as unknown as AuthenticatedRequestUser;

describe('DeleteAttachmentUseCase', () => {
  it('throws ATTACHMENT_NOT_FOUND when the attachment does not exist', async () => {
    const attachmentsRepository = { findById: vi.fn(async () => null) };
    const auditService = { log: vi.fn() };
    const activityEmitter = { emit: vi.fn() };
    const transactionPort = { run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})) };
    const useCase = new DeleteAttachmentUseCase(
      attachmentsRepository as never,
      auditService as never,
      transactionPort as never,
      activityEmitter as never,
    );

    await expect(useCase.execute(actor, 'att-1')).rejects.toMatchObject({
      code: ERROR_CODES.ATTACHMENT_NOT_FOUND,
    });
    expect(transactionPort.run).not.toHaveBeenCalled();
  });

  it('soft-deletes the attachment, audits it, and emits an activity', async () => {
    const attachment = {
      id: 'att-1',
      organizationId: 'org-1',
      fileId: 'file-1',
      entityType: 'project',
      entityId: 'project-1',
      label: null,
      createdById: 'user-1',
    };
    const attachmentsRepository = {
      findById: vi.fn(async () => attachment),
      softDelete: vi.fn(async () => undefined),
    };
    const auditService = { log: vi.fn(async () => undefined) };
    const activityEmitter = { emit: vi.fn(async () => undefined) };
    const transactionPort = { run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})) };
    const useCase = new DeleteAttachmentUseCase(
      attachmentsRepository as never,
      auditService as never,
      transactionPort as never,
      activityEmitter as never,
    );

    await useCase.execute(actor, 'att-1');

    expect(attachmentsRepository.softDelete).toHaveBeenCalledWith(
      'att-1',
      expect.anything(),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'attachment.deleted' }),
      expect.anything(),
    );
    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        summary: expect.stringContaining('removed from project'),
        entityType: 'attachment',
        entityId: 'att-1',
        actorId: 'user-1',
        metadata: {
          fileId: 'file-1',
          targetEntityType: 'project',
          targetEntityId: 'project-1',
        },
      }),
      expect.anything(),
    );
  });

  it('skips the activity emit when the attachment has no organization', async () => {
    const attachment = {
      id: 'att-1',
      organizationId: null,
      fileId: 'file-1',
      entityType: 'project',
      entityId: 'project-1',
      label: null,
      createdById: 'user-1',
    };
    const attachmentsRepository = {
      findById: vi.fn(async () => attachment),
      softDelete: vi.fn(async () => undefined),
    };
    const auditService = { log: vi.fn(async () => undefined) };
    const activityEmitter = { emit: vi.fn(async () => undefined) };
    const transactionPort = { run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})) };
    const useCase = new DeleteAttachmentUseCase(
      attachmentsRepository as never,
      auditService as never,
      transactionPort as never,
      activityEmitter as never,
    );

    await useCase.execute(actor, 'att-1');

    expect(auditService.log).toHaveBeenCalled();
    expect(activityEmitter.emit).not.toHaveBeenCalled();
  });
});
