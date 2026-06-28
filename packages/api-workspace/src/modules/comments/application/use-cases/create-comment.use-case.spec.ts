import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedRequestUser } from '@repo/api-core';

import { ACTION, AppError, ERROR_CODES, perm } from '@repo/api-core';

import { CreateCommentUseCase } from './create-comment.use-case';

const createActor = (
  permissions: string[],
): AuthenticatedRequestUser =>
  ({
    userId: 'user-1',
    organizationId: 'org-1',
    permissions,
  }) as unknown as AuthenticatedRequestUser;

const createComment = () => ({
  id: 'comment-1',
  organizationId: 'org-1',
  entityType: 'project',
  entityId: 'project-1',
  parentId: null,
  authorId: 'user-1',
  content: 'Looks good',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const input = {
  entityType: 'project',
  entityId: 'project-1',
  content: 'Looks good',
};

describe('CreateCommentUseCase', () => {
  it('rejects actors without the comments:create permission', async () => {
    const commentsRepository = { create: vi.fn() };
    const auditWriter = { log: vi.fn() };
    const useCase = new CreateCommentUseCase(
      commentsRepository as never,
      auditWriter as never,
    );

    await expect(useCase.execute(createActor([]), input)).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });
    expect(commentsRepository.create).not.toHaveBeenCalled();
    expect(auditWriter.log).not.toHaveBeenCalled();
  });

  it('creates the comment, writes an audit log, and returns the dto', async () => {
    const comment = createComment();
    const commentsRepository = { create: vi.fn(async () => comment) };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new CreateCommentUseCase(
      commentsRepository as never,
      auditWriter as never,
    );

    const actor = createActor([perm('comments', ACTION.CREATE)]);
    const result = await useCase.execute(actor, input);

    expect(commentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        authorId: 'user-1',
        content: 'Looks good',
        parentId: null,
      }),
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        action: 'comment.created',
        metadata: { commentId: 'comment-1' },
      }),
    );
    expect(result).toMatchObject({ id: 'comment-1', content: 'Looks good' });
  });

  it('throws when the insert returns no row', async () => {
    const commentsRepository = { create: vi.fn(async () => null) };
    const auditWriter = { log: vi.fn() };
    const useCase = new CreateCommentUseCase(
      commentsRepository as never,
      auditWriter as never,
    );

    const actor = createActor([perm('comments', ACTION.CREATE)]);
    await expect(useCase.execute(actor, input)).rejects.toThrow();
    expect(auditWriter.log).not.toHaveBeenCalled();
  });
});
