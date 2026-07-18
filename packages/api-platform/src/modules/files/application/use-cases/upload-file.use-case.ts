import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  AppError, ERROR_CODES, requireOrganizationId , SYSTEM_SCOPE } from '@repo/api-core';
import { createHash, randomUUID } from 'node:crypto';

import { AuditService } from '../../../audit/application/audit.service';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../storage/application/object-storage.interface';
import {
  getUploadExtension,
  MAX_FILE_SIZE_BYTES,
  resolveUploadedFileMimeType,
} from '../../domain/upload-policy';
import { FilesMapper } from '../files.mapper';
import { FILES_REPOSITORY, type FilesRepositoryPort } from '../ports/files.repository.port';

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
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    file: UploadedFile,
    requestContext?: RequestContext,
  ) {
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

    const storageKey = `uploads/${actor.userId}/${randomUUID()}${extension}`;
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    await this.objectStorage.upload({
      key: storageKey,
      body: file.buffer,
      mimeType: detectedMimeType,
    });

    try {
      const organizationId = requireOrganizationId(actor);
      const record = await this.filesRepository.create({
        organizationId,
        storageKey,
        originalName: file.originalname,
        mimeType: detectedMimeType,
        sizeBytes: file.size,
        checksum,
        latestVersion: 1,
        uploadedById: actor.userId,
      });

      if (!record) {
        throw new Error('File insert returned no rows');
      }

      await this.filesRepository.createVersion({
        fileId: record.id,
        organizationId,
        versionNumber: 1,
        storageKey,
        mimeType: detectedMimeType,
        sizeBytes: file.size,
        checksum,
        createdById: actor.userId,
      });

      await this.auditService.log({
        actorId: actor.userId,
        action: 'file.uploaded',
        entityType: 'file',
        entityId: record.id,
        requestContext,
      ...(organizationId ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId } : { scope: SYSTEM_SCOPE.PLATFORM })
    });

      return FilesMapper.toFileDto(record);
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }
}
