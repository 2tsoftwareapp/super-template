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
import { AUDIT_WRITER, type AuditWriter } from "@repo/api-runtime";
import { createHash, randomUUID } from "node:crypto";

import { OBJECT_STORAGE, type ObjectStorage } from "../../../storage";
import { FileVersionConflictError } from "../../domain/errors";
import {
  getUploadExtension,
  MAX_FILE_SIZE_BYTES,
  resolveUploadedFileMimeType,
} from "../../domain/upload-policy";
import { FilesMapper } from "../files.mapper";
import { FILES_REPOSITORY, type FilesRepositoryPort } from "../ports/files.repository.port";
import { FileAccessService } from "../services/file-access.service";

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class CreateFileVersionUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    fileId: string,
    file: UploadedFile,
    requestContext?: RequestContext,
  ) {
    const existing = await this.fileAccessService.findAccessibleFile(actor, fileId);

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

    const organizationId = requireOrganizationId(actor);
    const storageKey = `uploads/${actor.userId}/${randomUUID()}${extension}`;
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    const nextVersion = existing.latestVersion + 1;

    await this.objectStorage.upload({
      key: storageKey,
      body: file.buffer,
      mimeType: detectedMimeType,
    });

    try {
      const updated = await this.transactionPort.withTenant(
        { tenantId: organizationId, userId: actor.userId },
        async (tx) => {
          try {
            await this.filesRepository.createVersion(
              {
                fileId: existing.id,
                organizationId,
                versionNumber: nextVersion,
                storageKey,
                mimeType: detectedMimeType,
                sizeBytes: file.size,
                checksum,
                createdById: actor.userId,
              },
              tx,
            );
          } catch (error) {
            // The repository translates the unique (file_id, version_number)
            // violation into a domain error — surface a soft conflict instead
            // of a 500; a concurrent upload can simply be retried.
            if (error instanceof FileVersionConflictError) {
              throw new AppError(
                ERROR_CODES.RESOURCE_CONFLICT,
                "File version was updated concurrently, please retry",
                HttpStatus.CONFLICT,
              );
            }
            throw error;
          }

          const updatedRecord = await this.filesRepository.setCurrentVersion(
            existing.id,
            {
              storageKey,
              mimeType: detectedMimeType,
              sizeBytes: file.size,
              checksum,
              latestVersion: nextVersion,
            },
            // CAS: the file must still point at the version we are bumping
            // from, otherwise a concurrent upload already advanced it.
            existing.latestVersion,
            tx,
          );

          if (!updatedRecord) {
            throw new AppError(
              ERROR_CODES.RESOURCE_CONFLICT,
              "File version was updated concurrently, please retry",
              HttpStatus.CONFLICT,
            );
          }

          await this.auditWriter.log(
            {
              actorId: actor.userId,
              action: "file.version_uploaded",
              entityType: "file",
              entityId: existing.id,
              metadata: { versionNumber: nextVersion },
              requestContext,
              scope: SYSTEM_SCOPE.ORGANIZATION,
              organizationId,
            },
            tx,
          );

          return updatedRecord;
        },
      );

      return FilesMapper.toFileDto(updated);
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }
}
