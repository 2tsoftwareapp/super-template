import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  ERROR_CODES,
  requireOrganizationId,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
  type TransactionPort,
} from "@repo/api-runtime";

import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";
import { createHash, randomUUID } from "node:crypto";

import { OBJECT_STORAGE, type ObjectStorage } from "../../../storage";
import {
  getUploadExtension,
  MAX_FILE_SIZE_BYTES,
  resolveUploadedFileMimeType,
} from "../../domain/upload-policy";
import { FilesMapper } from "../files.mapper";
import { FILES_REPOSITORY, type FilesRepositoryPort } from "../ports/files.repository.port";
import { AUDIT_WRITER } from "@repo/feature-audit/contracts";
import type { AuditWriter } from "@repo/feature-audit/contracts";

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class UploadFileUseCase {
  constructor(
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    file: UploadedFile,
    requestContext?: RequestContext,
  ) {
    if (!file?.buffer) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, "File is required", HttpStatus.BAD_REQUEST);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "File exceeds maximum size of 10MB",
        HttpStatus.BAD_REQUEST,
      );
    }

    const extension = getUploadExtension(file.originalname);
    const detectedMimeType = resolveUploadedFileMimeType(file.buffer, file.originalname);

    if (!detectedMimeType) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "Unsupported or invalid file type",
        HttpStatus.BAD_REQUEST,
      );
    }

    const storageKey = `uploads/${actor.userId}/${randomUUID()}${extension}`;
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    await this.objectStorage.upload({
      key: storageKey,
      body: file.buffer,
      mimeType: detectedMimeType,
    });

    try {
      const organizationId = requireOrganizationId(actor);
      const record = await this.transactionPort.withTenant(
        { tenantId: organizationId, userId: actor.userId },
        async (tx) => {
          const fileRecord = await this.filesRepository.create(
            {
              organizationId,
              storageKey,
              originalName: file.originalname,
              mimeType: detectedMimeType,
              sizeBytes: file.size,
              checksum,
              latestVersion: 1,
              uploadedById: actor.userId,
            },
            tx,
          );

          if (!fileRecord) {
            throw new Error("File insert returned no rows");
          }

          await this.filesRepository.createVersion(
            {
              fileId: fileRecord.id,
              organizationId,
              versionNumber: 1,
              storageKey,
              mimeType: detectedMimeType,
              sizeBytes: file.size,
              checksum,
              createdById: actor.userId,
            },
            tx,
          );

          await this.auditWriter.log(
            {
              actorId: actor.userId,
              action: "file.uploaded",
              entityType: "file",
              entityId: fileRecord.id,
              requestContext,
              scope: SYSTEM_SCOPE.ORGANIZATION,
              organizationId,
            },
            tx,
          );

          await this.activityEmitter.emit(
            {
              organizationId,
              summary: `File "${file.originalname}" uploaded`,
              entityType: "file",
              entityId: fileRecord.id,
              actorId: actor.userId,
              visibility: "INTERNAL",
              metadata: { sizeBytes: file.size, mimeType: detectedMimeType },
            },
            tx,
          );

          return fileRecord;
        },
      );

      return FilesMapper.toFileDto(record);
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }
}
