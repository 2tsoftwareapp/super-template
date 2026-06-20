import type { AuthenticatedRequestUser, RequestContext } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  ACTION,
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  perm,
} from '@repo/api-core';

import type { UpdateCommentCommand } from '../comments.types';

import { CommentsRepository } from '../../infrastructure/comments.repository';
import { toCommentDto } from './list-comments.use-case';

@Injectable()
export class UpdateCommentUseCase {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    commentId: string,
    input: UpdateCommentCommand,
    requestContext?: RequestContext,
  ) {
    const comment = await this.commentsRepository.findById(commentId);

    if (!comment) {
      throw new AppError(
        ERROR_CODES.COMMENT_NOT_FOUND,
        'Comment not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const canModerate = actor.permissions.includes(
      perm('comments', ACTION.UPDATE),
    );

    if (comment.authorId !== actor.userId && !canModerate) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot update this comment',
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.commentsRepository.update(commentId, {
      content: input.content,
    });

    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'comment.updated',
      entityType: comment.entityType,
      entityId: comment.entityId,
      metadata: { commentId },
      requestContext,
    });

    return toCommentDto(updated ?? comment);
  }
}
