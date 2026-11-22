import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { loadEnv } from "@lean/config";

import { AppError, ERROR_CODES } from "../../shared/errors";
import type { RequestUser } from "../../shared/current-user.decorator";
import { LocalStorageService } from "../../shared/storage/local-storage.service";
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
    @Inject(LocalStorageService) private readonly storage: LocalStorageService,
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

    await this.storage.put(storageKey, file.buffer);

    const row = await this.files
      .create({
        uploaderId,
        storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      })
      .catch(async (error: unknown) => {
        // No row means nobody can reach the bytes: delete them, keep the real error.
        await this.storage.remove(storageKey);
        throw error;
      });

    return toFileDto(row.id, row.originalName, row.mimeType, row.sizeBytes, row.createdAt);
  }

  async get(requester: RequestUser, fileId: string): Promise<FileDto> {
    const row = await this.requireFile(requester, fileId);

    return toFileDto(row.id, row.originalName, row.mimeType, row.sizeBytes, row.createdAt);
  }

  async download(requester: RequestUser, fileId: string): Promise<FileContent> {
    const row = await this.requireFile(requester, fileId);
    const content = await this.storage.read(row.storageKey);

    return { originalName: row.originalName, mimeType: row.mimeType, content };
  }

  /** Only the uploader or an admin may see a file; anyone else gets the same 404 as a missing one. */
  private async requireFile(requester: RequestUser, fileId: string) {
    const row = await this.files.findById(fileId);
    const allowed = row && (row.uploaderId === requester.userId || requester.role === "ADMIN");

    if (!row || !allowed) {
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
