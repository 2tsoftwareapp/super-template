import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiArrayResponse,
  ApiDataResponse,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';

import { AttachmentsService } from '../application/attachments.service';
import {
  AttachEntityDto,
  AttachmentDto,
  AttachmentsQueryDto,
} from './attachments.dto';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @Permissions(PERMISSION_NAMES.ATTACHMENTS_MANAGE)
  @ApiDataResponse(AttachmentDto, 201)
  attach(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: AttachEntityDto,
    @Req() request: Request,
  ) {
    return this.attachmentsService.attach(user, input, request.requestContext);
  }

  @Get()
  @Permissions(PERMISSION_NAMES.ATTACHMENTS_MANAGE)
  @ApiArrayResponse(AttachmentDto)
  list(@Query() query: AttachmentsQueryDto) {
    return this.attachmentsService.list(query);
  }

  @Delete(':id')
  @Permissions(PERMISSION_NAMES.ATTACHMENTS_MANAGE)
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') attachmentId: string,
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
