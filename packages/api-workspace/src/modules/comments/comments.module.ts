import { Module } from '@nestjs/common';

import { CommentsService } from './application/comments.service';
import { CreateCommentUseCase } from './application/use-cases/create-comment.use-case';
import { DeleteCommentUseCase } from './application/use-cases/delete-comment.use-case';
import { ListCommentsUseCase } from './application/use-cases/list-comments.use-case';
import { UpdateCommentUseCase } from './application/use-cases/update-comment.use-case';
import { CommentsRepository } from './infrastructure/comments.repository';
import { CommentsController } from './presentation/comments.controller';

@Module({
  controllers: [CommentsController],
  providers: [
    CommentsRepository,
    ListCommentsUseCase,
    CreateCommentUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
    CommentsService,
  ],
  exports: [CommentsRepository, CommentsService],
})
export class CommentsModule {}
