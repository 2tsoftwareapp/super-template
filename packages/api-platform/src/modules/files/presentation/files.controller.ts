import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ApiDataResponse,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import type { AuthenticatedRequestUser } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';
import { FilesService } from '../application/files.service';
import { FileDto, FileUrlDto } from './files.dto';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @Permissions(PERMISSION_NAMES.FILES_UPLOAD)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiDataResponse(FileDto, 201)
  upload(
    @CurrentUser() user: AuthenticatedRequestUser,
    @UploadedFile() file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
    @Req() request: Request,
  ) {
    return this.filesService.upload(user, file, request.requestContext);
  }

  @Get(':id')
  @Permissions(PERMISSION_NAMES.FILES_READ)
  @ApiDataResponse(FileDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') fileId: string,
  ) {
    return this.filesService.getById(user, fileId);
  }

  @Get(':id/url')
  @Permissions(PERMISSION_NAMES.FILES_READ)
  @ApiDataResponse(FileUrlDto)
  getUrl(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') fileId: string,
  ) {
    return this.filesService.getSignedUrl(user, fileId);
  }

  @Delete(':id')
  @Permissions(PERMISSION_NAMES.FILES_DELETE)
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') fileId: string,
    @Req() request: Request,
  ) {
    await this.filesService.delete(user, fileId, request.requestContext);

    return {
      data: { success: true },
    };
  }
}
