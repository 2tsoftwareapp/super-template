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

import { CommentsRepository } from '../../infrastructure/comments.repository';

@Injectable()
export class DeleteCommentUseCase {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    commentId: string,
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

    const canDeleteOthers = actor.permissions.includes(
      perm('comments', ACTION.DELETE),
    );

    if (comment.authorId !== actor.userId && !canDeleteOthers) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot delete this comment',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.commentsRepository.softDelete(commentId);

    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'comment.deleted',
      entityType: comment.entityType,
      entityId: comment.entityId,
      metadata: { commentId },
      requestContext,
    });
  }
}
