import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { Request } from 'express';
import type { Response } from 'express';

import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProduces, ApiTags } from '@nestjs/swagger';
import {
  ApiDataResponse,
  SuccessFlagDto,
} from '@repo/api-core';
import { CurrentUser } from '@repo/api-core';
import { Permissions } from '@repo/api-core';
import { PERMISSION_NAMES } from '@repo/api-core';

import { FilesService } from '../application/files.service';
import { UploadFileInterceptor } from './files-upload.interceptor';
import { FileDto, FileUrlDto } from './files.dto';

@ApiTags('files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @Permissions(PERMISSION_NAMES.FILES_UPLOAD)
  @UseInterceptors(UploadFileInterceptor)
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
    @Param('id', new ParseUUIDPipe()) fileId: string,
  ) {
    return this.filesService.getById(user, fileId);
  }

  @Get(':id/url')
  @Permissions(PERMISSION_NAMES.FILES_READ)
  @ApiDataResponse(FileUrlDto)
  getUrl(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) fileId: string,
  ) {
    return this.filesService.getSignedUrl(user, fileId);
  }

  @Get(':id/download')
  @Permissions(PERMISSION_NAMES.FILES_READ)
  @ApiProduces('application/octet-stream')
  async download(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) fileId: string,
    @Query('token') token: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { content, file } = await this.filesService.download(
      user,
      fileId,
      token,
    );
    const safeFilename = file.originalName.replace(/["\\\r\n]/g, '_');

    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    response.setHeader('Content-Length', content.length.toString());
    response.setHeader('X-Content-Type-Options', 'nosniff');

    return new StreamableFile(content);
  }

  @Delete(':id')
  @Permissions(PERMISSION_NAMES.FILES_DELETE)
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe()) fileId: string,
    @Req() request: Request,
  ) {
    await this.filesService.delete(user, fileId, request.requestContext);

    return {
      data: { success: true },
    };
  }
}
