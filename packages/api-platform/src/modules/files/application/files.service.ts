import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import { requireOrganizationId } from '@repo/api-core';
import { AuditService } from '../../audit/application/audit.service';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../storage/application/object-storage.interface';
import { FilesRepository } from '../infrastructure/files.repository';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
  ) {}

  async upload(
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

    const extension = extname(file.originalname) || '';
    const storageKey = `uploads/${actor.userId}/${randomUUID()}${extension}`;
    await this.objectStorage.upload({
      key: storageKey,
      body: file.buffer,
      mimeType: file.mimetype,
    });

    try {
      const record = await this.filesRepository.create({
        organizationId: requireOrganizationId(actor),
        storageKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
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

      return this.toFileDto(record);
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async getById(actor: AuthenticatedRequestUser, fileId: string) {
    const file = await this.findAccessibleFile(actor, fileId);
    return this.toFileDto(file);
  }

  async getSignedUrl(actor: AuthenticatedRequestUser, fileId: string) {
    const file = await this.findAccessibleFile(actor, fileId);
    const url = await this.objectStorage.getSignedUrl(file.storageKey);

    return {
      id: file.id,
      url,
      expiresInSeconds: 3600,
    };
  }

  async delete(
    actor: AuthenticatedRequestUser,
    fileId: string,
    requestContext?: RequestContext,
  ) {
    const file = await this.findAccessibleFile(actor, fileId);
    await this.filesRepository.softDelete(file.id);

    try {
      await this.objectStorage.delete(file.storageKey);
    } catch {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'File record was deleted but storage cleanup failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'file.deleted',
      entityType: 'file',
      entityId: file.id,
      requestContext,
    });
  }

  async findById(fileId: string) {
    return this.filesRepository.findById(fileId);
  }

  private async findAccessibleFile(
    actor: AuthenticatedRequestUser,
    fileId: string,
  ) {
    const file = await this.filesRepository.findById(fileId);

    if (!file) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        'File not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      file.uploadedById !== actor.userId &&
      !actor.roles.includes('ADMIN') &&
      !actor.roles.includes('SUPER_ADMIN')
    ) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You do not have access to this file',
        HttpStatus.FORBIDDEN,
      );
    }

    return file;
  }

  private toFileDto(
    file: NonNullable<Awaited<ReturnType<FilesRepository['findById']>>>,
  ) {
    return {
      id: file.id,
      storageKey: file.storageKey,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    };
  }
}
