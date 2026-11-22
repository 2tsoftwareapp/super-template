import type { Response } from "express";

import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { CurrentUser, type RequestUser } from "../../shared/current-user.decorator";
import { AppError, ERROR_CODES } from "../../shared/errors";
import type { FileDto } from "./files.dto";
import { FilesService, type UploadedFileInput } from "./files.service";

@Controller("files")
export class FilesController {
  constructor(@Inject(FilesService) private readonly files: FilesService) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: UploadedFileInput | undefined,
  ): Promise<{ data: FileDto }> {
    if (!file) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, "multipart field 'file' is required", 400);
    }

    return { data: await this.files.upload(user.userId, file) };
  }

  @Get(":id")
  async get(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) fileId: string,
  ): Promise<{ data: FileDto }> {
    return { data: await this.files.get(user, fileId) };
  }

  @Get(":id/download")
  async download(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseUUIDPipe) fileId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.files.download(user, fileId);
    const safeName = file.originalName.replace(/["\\\r\n]/g, "_");

    response.setHeader("content-type", file.mimeType);
    response.setHeader(
      "content-disposition",
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    response.setHeader("content-length", file.content.length.toString());
    response.setHeader("x-content-type-options", "nosniff");

    return new StreamableFile(file.content);
  }
}
