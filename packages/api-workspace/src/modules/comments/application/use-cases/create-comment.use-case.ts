import type { AuthenticatedRequestUser, RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  ACTION,
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  perm,
  requireOrganizationId,
} from '@repo/api-core';

import type { CreateCommentCommand } from '../comments.types';

import { CommentsRepository } from '../../infrastructure/comments.repository';
import { toCommentDto } from './list-comments.use-case';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateCommentCommand,
    requestContext?: RequestContext,
  ) {
    if (!actor.permissions.includes(perm('comments', ACTION.CREATE))) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You do not have permission to create comments',
        HttpStatus.FORBIDDEN,
      );
    }

    const comment = await this.commentsRepository.create({
      organizationId: requireOrganizationId(actor),
      entityType: input.entityType,
      entityId: input.entityId,
      parentId: input.parentId ?? null,
      authorId: actor.userId,
      content: input.content,
    });

    if (!comment) {
      throw new Error('Comment insert returned no rows');
    }

    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'comment.created',
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { commentId: comment.id },
      requestContext,
    });

    return toCommentDto(comment);
  }
}
