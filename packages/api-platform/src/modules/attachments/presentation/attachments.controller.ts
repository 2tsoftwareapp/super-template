import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {  ACTION, ApiArrayResponse, ApiDataResponse, perm, SuccessFlagDto } from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Authorize } from '@repo/api-core';

import { AttachmentsService } from '../application/attachments.service';
import {
  AttachEntityDto,
  AttachmentDto,
  AttachmentsQueryDto } from './attachments.dto';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @Authorize({ permissions: [perm('attachments', ACTION.CREATE)] })
  @ApiDataResponse(AttachmentDto, 201)
  attach(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: AttachEntityDto,
    @Req() request: Request,
  ) {
    return this.attachmentsService.attach(
      user,
      {
        fileId: input.fileId,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.label !== undefined ? { label: input.label } : {}) },
      request.requestContext,
    );
  }

  @Get()
  @Authorize({ permissions: [perm('attachments', ACTION.READ)] })
  @ApiArrayResponse(AttachmentDto)
  list(@Query() query: AttachmentsQueryDto) {
    return this.attachmentsService.list({
      entityType: query.entityType,
      entityId: query.entityId });
  }

  @Delete(':id')
  @Authorize({ permissions: [perm('attachments', ACTION.DELETE)] })
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) attachmentId: string,
    @Req() request: Request,
  ) {
    await this.attachmentsService.delete(
      user,
      attachmentId,
      request.requestContext,
    );

    return { data: { success: true } };
  }
}
