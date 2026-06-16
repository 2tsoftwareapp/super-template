import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core/common/constants/error-codes';
import { AppError } from '@repo/api-core/common/errors/app-error';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core/common/types/request-context';
import { PERMISSION_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';
import { requireOrganizationId } from '@repo/api-core/common/utils/require-organization';
import { AuditService } from '@repo/api-platform/modules/audit/application/audit.service';
import { CommentsRepository } from '../infrastructure/comments.repository';
import type {
  CommentsQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from '../presentation/comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly auditService: AuditService,
  ) {}

  async list(query: CommentsQueryDto) {
    const result = await this.commentsRepository.listByEntity({
      page: query.page,
      limit: query.limit,
      entityType: query.entityType,
      entityId: query.entityId,
    });

    return {
      rows: result.rows.map((row) => this.toDto(row)),
      total: result.total,
    };
  }

  async create(
    actor: AuthenticatedRequestUser,
    input: CreateCommentDto,
    requestContext?: RequestContext,
  ) {
    if (!actor.permissions.includes(PERMISSION_NAMES.COMMENTS_CREATE)) {
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

    await this.auditService.log({
      actorId: actor.userId,
      action: 'comment.created',
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { commentId: comment.id },
      requestContext,
    });

    return this.toDto(comment);
  }

  async update(
    actor: AuthenticatedRequestUser,
    commentId: string,
    input: UpdateCommentDto,
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
      PERMISSION_NAMES.COMMENTS_MODERATE,
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

    await this.auditService.log({
      actorId: actor.userId,
      action: 'comment.updated',
      entityType: comment.entityType,
      entityId: comment.entityId,
      metadata: { commentId },
      requestContext,
    });

    return this.toDto(updated ?? comment);
  }

  async delete(
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

    const canModerate = actor.permissions.includes(
      PERMISSION_NAMES.COMMENTS_MODERATE,
    );

    if (comment.authorId !== actor.userId && !canModerate) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot delete this comment',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.commentsRepository.softDelete(commentId);

    await this.auditService.log({
      actorId: actor.userId,
      action: 'comment.deleted',
      entityType: comment.entityType,
      entityId: comment.entityId,
      metadata: { commentId },
      requestContext,
    });
  }

  private toDto(
    comment: NonNullable<Awaited<ReturnType<CommentsRepository['findById']>>>,
  ) {
    return {
      id: comment.id,
      entityType: comment.entityType,
      entityId: comment.entityId,
      parentId: comment.parentId ?? null,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };
  }
}
