import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { loadEnv } from "@lean/config";

import { AppError, ERROR_CODES } from "../../shared/errors";
import type { RequestUser } from "../../shared/current-user.decorator";
import { LocalStorageService } from "../../shared/storage/local-storage.service";
import { FilesRepository } from "./files.repository";
import type { FileRow } from "@lean/db";

import type { FileDto } from "./files.dto";
import { buildPageMeta, type PageMeta } from "../../shared/pagination";

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

    return toFileDto(row);
  }

  /** Admins see every file, everyone else only their own uploads. */
  async list(
    requester: RequestUser,
    page: { page: number; limit: number },
  ): Promise<{ data: FileDto[]; meta: PageMeta }> {
    const uploaderId = requester.role === "ADMIN" ? undefined : requester.userId;
    const { rows, total } = await this.files.list({ ...page, uploaderId });

    return {
      data: rows.map(toFileDto),
      meta: buildPageMeta(total, page.page, page.limit),
    };
  }

  /** Row first: once it is gone nobody can reach the bytes, so a failed unlink only leaks disk. */
  async remove(requester: RequestUser, fileId: string): Promise<void> {
    const row = await this.requireFile(requester, fileId);

    await this.files.delete(row.id);
    await this.storage.remove(row.storageKey);
  }

  async get(requester: RequestUser, fileId: string): Promise<FileDto> {
    const row = await this.requireFile(requester, fileId);

    return toFileDto(row);
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

function toFileDto(row: FileRow): FileDto {
  return {
    id: row.id,
    originalName: row.originalName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploaderId: row.uploaderId,
    createdAt: row.createdAt.toISOString(),
    downloadUrl: `/api/v1/files/${row.id}/download`,
  };
}
