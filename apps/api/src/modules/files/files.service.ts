import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { loadEnv } from "@lean/config";

import { AppError, ERROR_CODES } from "../../shared/errors";
import { STORAGE, type StoragePort } from "../../shared/storage/storage.port";
import { FilesRepository } from "./files.repository";
import type { FileDto } from "./files.dto";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
]);

export interface UploadedFileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface FileContent {
  originalName: string;
  mimeType: string;
  content: Buffer;
}

@Injectable()
export class FilesService {
  private readonly maxUploadBytes = loadEnv().MAX_UPLOAD_BYTES;

  constructor(
    @Inject(FilesRepository) private readonly files: FilesRepository,
    @Inject(STORAGE) private readonly storage: StoragePort,
  ) {}

  async upload(uploaderId: string, file: UploadedFileInput): Promise<FileDto> {
    if (file.size > this.maxUploadBytes) {
      throw new AppError(
        ERROR_CODES.FILE_TOO_LARGE,
        `File exceeds ${this.maxUploadBytes} bytes`,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new AppError(
        ERROR_CODES.FILE_TYPE_NOT_ALLOWED,
        "This file type is not allowed",
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }

    const storageKey = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extname(file.originalname)}`;

    await this.storage.put(storageKey, file.buffer, file.mimetype);

    const row = await this.files.create({
      uploaderId,
      storageKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    return toFileDto(row.id, row.originalName, row.mimeType, row.sizeBytes, row.createdAt);
  }

  async get(fileId: string): Promise<FileDto> {
    const row = await this.requireFile(fileId);

    return toFileDto(row.id, row.originalName, row.mimeType, row.sizeBytes, row.createdAt);
  }

  async download(fileId: string): Promise<FileContent> {
    const row = await this.requireFile(fileId);
    const content = await this.storage.read(row.storageKey);

    return { originalName: row.originalName, mimeType: row.mimeType, content };
  }

  private async requireFile(fileId: string) {
    const row = await this.files.findById(fileId);

    if (!row) {
      throw new AppError(ERROR_CODES.FILE_NOT_FOUND, "File not found", HttpStatus.NOT_FOUND);
    }

    return row;
  }
}

function toFileDto(
  id: string,
  originalName: string,
  mimeType: string,
  sizeBytes: number,
  createdAt: Date,
): FileDto {
  return {
    id,
    originalName,
    mimeType,
    sizeBytes,
    createdAt: createdAt.toISOString(),
    downloadUrl: `/api/v1/files/${id}/download`,
  };
}
