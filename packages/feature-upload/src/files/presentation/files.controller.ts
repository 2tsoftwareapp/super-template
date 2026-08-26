import type { AuthenticatedRequestUser } from "@repo/api-runtime";
import type { Request } from "express";
import type { Response } from "express";

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
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProduces, ApiTags } from "@nestjs/swagger";
import {
  ACTION,
  ApiArrayResponse,
  ApiDataResponse,
  ApiPaginatedResponse,
  perm,
  SuccessFlagDto,
} from "@repo/api-runtime";
import { CurrentUser } from "@repo/api-runtime";
import { Authorize } from "@repo/api-runtime";
import { SkipEnvelope } from "@repo/api-runtime";

import { BatchDeleteFilesUseCase } from "../application/use-cases/batch-delete-files.use-case";
import { CreateFileVersionUseCase } from "../application/use-cases/create-file-version.use-case";
import { DeleteFileUseCase } from "../application/use-cases/delete-file.use-case";
import { DownloadFileUseCase } from "../application/use-cases/download-file.use-case";
import { GetFileHistoryUseCase } from "../application/use-cases/get-file-history.use-case";
import { GetFileSignedUrlUseCase } from "../application/use-cases/get-file-signed-url.use-case";
import { GetFileUseCase } from "../application/use-cases/get-file.use-case";
import { ListFileVersionsUseCase } from "../application/use-cases/list-file-versions.use-case";
import { ListFilesUseCase } from "../application/use-cases/list-files.use-case";
import { UploadFileUseCase } from "../application/use-cases/upload-file.use-case";
import { UploadFileInterceptor } from "./files-upload.interceptor";
import {
  BatchDeleteFilesDto,
  BatchDeleteResultDto,
  FileDto,
  FileHistoryEventDto,
  FilesQueryDto,
  FileUrlDto,
  FileVersionDto,
} from "./files.dto";

@ApiTags("files")
@ApiBearerAuth()
@Controller("files")
export class FilesController {
  constructor(
    private readonly uploadFile: UploadFileUseCase,
    private readonly getFile: GetFileUseCase,
    private readonly getFileSignedUrl: GetFileSignedUrlUseCase,
    private readonly downloadFile: DownloadFileUseCase,
    private readonly deleteFile: DeleteFileUseCase,
    private readonly listFiles: ListFilesUseCase,
    private readonly createFileVersion: CreateFileVersionUseCase,
    private readonly listFileVersions: ListFileVersionsUseCase,
    private readonly getFileHistory: GetFileHistoryUseCase,
    private readonly batchDeleteFiles: BatchDeleteFilesUseCase,
  ) {}

  @Get()
  @Authorize({ permissions: [perm("files", ACTION.READ)] })
  @ApiPaginatedResponse(FileDto)
  async list(@CurrentUser() user: AuthenticatedRequestUser, @Query() query: FilesQueryDto) {
    const result = await this.listFiles.execute(user, {
      page: query.page,
      limit: query.limit,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.mimeType !== undefined ? { mimeType: query.mimeType } : {}),
      ...(query.uploadedById !== undefined ? { uploadedById: query.uploadedById } : {}),
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
    });

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

  @Post("batch-delete")
  @Authorize({ permissions: [perm("files", ACTION.DELETE)] })
  @ApiDataResponse(BatchDeleteResultDto, 201)
  async batchDelete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() input: BatchDeleteFilesDto,
    @Req() request: Request,
  ) {
    const results = await this.batchDeleteFiles.execute(
      user,
      input.fileIds,
      input.idempotencyKey,
      request.requestContext,
    );

    return { data: { results } };
  }

  @Post()
  @Authorize({ permissions: [perm("files", ACTION.CREATE)] })
  @UseInterceptors(UploadFileInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiDataResponse(FileDto, 201)
  upload(
    @CurrentUser() user: AuthenticatedRequestUser,
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
    @Req() request: Request,
  ) {
    return this.uploadFile.execute(user, file, request.requestContext);
  }

  @Get(":id")
  @Authorize({ permissions: [perm("files", ACTION.READ)] })
  @ApiDataResponse(FileDto)
  getById(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) fileId: string,
  ) {
    return this.getFile.execute(user, fileId);
  }

  @Get(":id/url")
  @Authorize({ permissions: [perm("files", ACTION.READ)] })
  @ApiDataResponse(FileUrlDto)
  getUrl(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) fileId: string,
  ) {
    return this.getFileSignedUrl.execute(user, fileId);
  }

  @Get(":id/download")
  @Authorize({ permissions: [perm("files", ACTION.READ)] })
  @SkipEnvelope()
  @ApiProduces("application/octet-stream")
  async download(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) fileId: string,
    @Query("token") token: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { content, file } = await this.downloadFile.execute(user, fileId, token);
    const safeFilename = file.originalName.replace(/["\\\r\n]/g, "_");

    response.setHeader("Content-Type", "application/octet-stream");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    response.setHeader("Content-Length", content.length.toString());
    response.setHeader("X-Content-Type-Options", "nosniff");

    return new StreamableFile(content);
  }

  @Post(":id/versions")
  @Authorize({ permissions: [perm("files", ACTION.CREATE)] })
  @UseInterceptors(UploadFileInterceptor)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiDataResponse(FileDto, 201)
  async uploadVersion(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) fileId: string,
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
    @Req() request: Request,
  ) {
    return this.createFileVersion.execute(user, fileId, file, request.requestContext);
  }

  @Get(":id/versions")
  @Authorize({ permissions: [perm("files", ACTION.READ)] })
  @ApiArrayResponse(FileVersionDto)
  async listVersions(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) fileId: string,
  ) {
    return { data: await this.listFileVersions.execute(user, fileId) };
  }

  @Get(":id/history")
  @Authorize({ permissions: [perm("files", ACTION.READ)] })
  @ApiArrayResponse(FileHistoryEventDto)
  async getHistory(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) fileId: string,
  ) {
    return { data: await this.getFileHistory.execute(user, fileId) };
  }

  @Delete(":id")
  @Authorize({ permissions: [perm("files", ACTION.DELETE)] })
  @ApiDataResponse(SuccessFlagDto)
  async delete(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param("id", new ParseUUIDPipe()) fileId: string,
    @Req() request: Request,
  ) {
    await this.deleteFile.execute(user, fileId, request.requestContext);

    return {
      data: { success: true },
    };
  }
}
