import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES, requireOrganizationId } from '@repo/api-core';
import { createHash, randomUUID } from 'node:crypto';

import { AuditService } from '../../../audit/application/audit.service';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../storage/application/object-storage.interface';
import { FilesRepository } from '../../infrastructure/files.repository';
import {
  getUploadExtension,
  MAX_FILE_SIZE_BYTES,
  resolveUploadedFileMimeType,
} from '../files-upload.policy';
import { FilesMapper } from '../files.mapper';
import { FileAccessService } from '../services/file-access.service';

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
    private readonly filesRepository: FilesRepository,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    fileId: string,
    file: UploadedFile,
    requestContext?: RequestContext,
  ) {
    const existing = await this.fileAccessService.findAccessibleFile(
      actor,
      fileId,
    );

    if (!file?.buffer) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'File is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'File exceeds maximum size of 10MB',
        HttpStatus.BAD_REQUEST,
      );
    }

    const extension = getUploadExtension(file.originalname);
    const detectedMimeType = resolveUploadedFileMimeType(
      file.buffer,
      file.originalname,
    );

    if (!detectedMimeType) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Unsupported or invalid file type',
        HttpStatus.BAD_REQUEST,
      );
    }

    const organizationId = requireOrganizationId(actor);
    const storageKey = `uploads/${actor.userId}/${randomUUID()}${extension}`;
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const nextVersion = existing.latestVersion + 1;

    await this.objectStorage.upload({
      key: storageKey,
      body: file.buffer,
      mimeType: detectedMimeType,
    });

    try {
      await this.filesRepository.createVersion({
        fileId: existing.id,
        organizationId,
        versionNumber: nextVersion,
        storageKey,
        mimeType: detectedMimeType,
        sizeBytes: file.size,
        checksum,
        createdById: actor.userId,
      });

      const updated = await this.filesRepository.setCurrentVersion(
        existing.id,
        {
          storageKey,
          mimeType: detectedMimeType,
          sizeBytes: file.size,
          checksum,
          latestVersion: nextVersion,
        },
      );

      if (!updated) {
        throw new Error('File version update returned no rows');
      }

      await this.auditService.log({
        actorId: actor.userId,
        action: 'file.version_uploaded',
        entityType: 'file',
        entityId: existing.id,
        metadata: { versionNumber: nextVersion },
        requestContext,
      });

      return FilesMapper.toFileDto(updated);
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }
}
