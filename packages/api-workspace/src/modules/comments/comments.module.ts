import { Module } from '@nestjs/common';

import { CommentsService } from './application/comments.service';
import { CommentsRepository } from './infrastructure/comments.repository';
import { CommentsController } from './presentation/comments.controller';

@Module({
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsService],
  exports: [CommentsRepository, CommentsService],
})
export class CommentsModule {}
