import { Injectable } from '@nestjs/common';

import type { ListCommentsQuery } from '../comments.types';

import { CommentsRepository } from '../../infrastructure/comments.repository';

@Injectable()
export class ListCommentsUseCase {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute(query: ListCommentsQuery) {
    const result = await this.commentsRepository.listByEntity({
      page: query.page,
      limit: query.limit,
      entityType: query.entityType,
      entityId: query.entityId,
    });

    return {
      rows: result.rows.map((row) => toCommentDto(row)),
      total: result.total,
    };
  }
}

export function toCommentDto(
  comment: NonNullable<
    Awaited<ReturnType<CommentsRepository['findById']>>
  >,
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
