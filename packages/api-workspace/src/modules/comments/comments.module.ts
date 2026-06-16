import { Module } from '@nestjs/common';
import { AuditModule } from '@repo/api-platform/modules/audit/audit.module';
import { CommentsService } from './application/comments.service';
import { CommentsRepository } from './infrastructure/comments.repository';
import { CommentsController } from './presentation/comments.controller';

@Module({
  imports: [AuditModule],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsService],
  exports: [CommentsRepository, CommentsService],
})
export class CommentsModule {}
