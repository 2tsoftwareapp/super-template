import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES, requireOrganizationId } from '@repo/api-core';
import { randomUUID } from 'node:crypto';

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

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class UploadFileUseCase {
  constructor(
    private readonly filesRepository: FilesRepository,
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
    await this.objectStorage.upload({
      key: storageKey,
      body: file.buffer,
      mimeType: detectedMimeType,
    });

    try {
      const record = await this.filesRepository.create({
        organizationId: requireOrganizationId(actor),
        storageKey,
        originalName: file.originalname,
        mimeType: detectedMimeType,
        sizeBytes: file.size,
        uploadedById: actor.userId,
      });

      if (!record) {
        throw new Error('File insert returned no rows');
      }

      await this.auditService.log({
        actorId: actor.userId,
        action: 'file.uploaded',
        entityType: 'file',
        entityId: record.id,
        requestContext,
      });

      return FilesMapper.toFileDto(record);
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }
}
