import type { AuthenticatedRequestUser } from "@repo/api-kernel";
import type { Request } from "express";

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ACTION, ApiArrayResponse, ApiDataResponse, perm, SuccessFlagDto } from "@repo/api-runtime";
import { CurrentUser } from "@repo/api-runtime";
import { Authorize } from "@repo/api-runtime";

import { AttachFileUseCase } from "../application/use-cases/attach-file.use-case";
import { DeleteAttachmentUseCase } from "../application/use-cases/delete-attachment.use-case";
import { ListAttachmentsUseCase } from "../application/use-cases/list-attachments.use-case";
import { AttachEntityDto, AttachmentDto, AttachmentsQueryDto } from "./dto/attachments.dto";

@ApiTags("attachments")
@ApiBearerAuth()
@Controller("attachments")
export class AttachmentsController {
  constructor(
    private readonly attachFile: AttachFileUseCase,
    private readonly listAttachments: ListAttachmentsUseCase,
    private readonly deleteAttachment: DeleteAttachmentUseCase,
  ) {}

  @Post()
  @Authorize({ permissions: [perm("attachments", ACTION.CREATE)] })
  @ApiDataResponse(AttachmentDto, 201)
  attach(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: AttachEntityDto,
    @Req() request: Request,
  ) {
    return this.attachFile.execute(
      user,
      {
        fileId: input.fileId,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.label !== undefined ? { label: input.label } : {}),
      },
      request.requestContext,
    );
  }

  @Get()
  @Authorize({ permissions: [perm("attachments", ACTION.READ)] })
  @ApiArrayResponse(AttachmentDto)
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query() query: AttachmentsQueryDto) {
    return this.listAttachments.execute(
      {
        entityType: query.entityType,
        entityId: query.entityId,
      },
      user.organizationId,
    );
  }

  @Delete(":id")
  @Authorize({ permissions: [perm("attachments", ACTION.DELETE)] })
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) attachmentId: string,
    @Req() request: Request,
  ) {
    await this.deleteAttachment.execute(user, attachmentId, request.requestContext);

    return { data: { success: true } };
  }
}
