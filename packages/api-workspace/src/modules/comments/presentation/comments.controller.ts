import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiDataResponse,
  ApiPaginatedResponse,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { CommentsService } from '../application/comments.service';
import {
  CommentDto,
  CommentsQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './comments.dto';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @Permissions(PERMISSION_NAMES.COMMENTS_READ)
  @ApiPaginatedResponse(CommentDto)
  async list(@Query() query: CommentsQueryDto) {
    const result = await this.commentsService.list(query);

    return {
      data: result.rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  @Post()
  @Permissions(PERMISSION_NAMES.COMMENTS_CREATE)
  @ApiDataResponse(CommentDto, 201)
  create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: CreateCommentDto,
    @Req() request: Request,
  ) {
    return this.commentsService.create(user, input, request.requestContext);
  }

  @Patch(':id')
  @Permissions(PERMISSION_NAMES.COMMENTS_CREATE)
  @ApiDataResponse(CommentDto)
  update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) commentId: string,
    @Body() input: UpdateCommentDto,
    @Req() request: Request,
  ) {
    return this.commentsService.update(
      user,
      commentId,
      input,
      request.requestContext,
    );
  }

  @Delete(':id')
  @Permissions(PERMISSION_NAMES.COMMENTS_CREATE)
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) commentId: string,
    @Req() request: Request,
  ) {
    await this.commentsService.delete(user, commentId, request.requestContext);

    return {
      data: { success: true },
    };
  }
}
