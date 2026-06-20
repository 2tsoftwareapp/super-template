import type { AuthenticatedRequestUser, RequestContext } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  CreateCommentCommand,
  ListCommentsQuery,
  UpdateCommentCommand,
} from './comments.types';

import { CreateCommentUseCase } from './use-cases/create-comment.use-case';
import { DeleteCommentUseCase } from './use-cases/delete-comment.use-case';
import { ListCommentsUseCase } from './use-cases/list-comments.use-case';
import { UpdateCommentUseCase } from './use-cases/update-comment.use-case';

@Injectable()
export class CommentsService {
  constructor(
    private readonly listCommentsUseCase: ListCommentsUseCase,
    private readonly createCommentUseCase: CreateCommentUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
  ) {}

  async list(query: ListCommentsQuery) {
    return this.listCommentsUseCase.execute(query);
  }

  async create(
    actor: AuthenticatedRequestUser,
    input: CreateCommentCommand,
    requestContext?: RequestContext,
  ) {
    return this.createCommentUseCase.execute(actor, input, requestContext);
  }

  async update(
    actor: AuthenticatedRequestUser,
    commentId: string,
    input: UpdateCommentCommand,
    requestContext?: RequestContext,
  ) {
    return this.updateCommentUseCase.execute(
      actor,
      commentId,
      input,
      requestContext,
    );
  }

  async delete(
    actor: AuthenticatedRequestUser,
    commentId: string,
    requestContext?: RequestContext,
  ) {
    return this.deleteCommentUseCase.execute(actor, commentId, requestContext);
  }
}
