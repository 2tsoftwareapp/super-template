import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  PERMISSION_NAMES,
  requireOrganizationId,
} from '@repo/api-core';

import type {
  CreateCommentCommand,
  ListCommentsQuery,
  UpdateCommentCommand,
} from './comments.types';

import { CommentsRepository } from '../infrastructure/comments.repository';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async list(query: ListCommentsQuery) {
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
    input: CreateCommentCommand,
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

    await this.auditWriter.log({
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
      PERMISSION_NAMES.COMMENTS_UPDATE,
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

    const canDeleteOthers = actor.permissions.includes(
      PERMISSION_NAMES.COMMENTS_DELETE,
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
