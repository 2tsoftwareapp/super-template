import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import { FilesRepository } from '../infrastructure/files.repository';
import { DeleteFileUseCase } from './use-cases/delete-file.use-case';
import { DownloadFileUseCase } from './use-cases/download-file.use-case';
import { GetFileSignedUrlUseCase } from './use-cases/get-file-signed-url.use-case';
import { GetFileUseCase } from './use-cases/get-file.use-case';
import { UploadFileUseCase } from './use-cases/upload-file.use-case';

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly getFileUseCase: GetFileUseCase,
    private readonly getFileSignedUrlUseCase: GetFileSignedUrlUseCase,
    private readonly downloadFileUseCase: DownloadFileUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
  ) {}

  async upload(
    actor: AuthenticatedRequestUser,
    file: UploadedFile,
    requestContext?: RequestContext,
  ) {
    return this.uploadFileUseCase.execute(actor, file, requestContext);
  }

  async getById(actor: AuthenticatedRequestUser, fileId: string) {
    return this.getFileUseCase.execute(actor, fileId);
  }

  async getSignedUrl(actor: AuthenticatedRequestUser, fileId: string) {
    return this.getFileSignedUrlUseCase.execute(actor, fileId);
  }

  async download(
    actor: AuthenticatedRequestUser,
    fileId: string,
    token?: string,
  ) {
    return this.downloadFileUseCase.execute(actor, fileId, token);
  }

  async delete(
    actor: AuthenticatedRequestUser,
    fileId: string,
    requestContext?: RequestContext,
  ) {
    return this.deleteFileUseCase.execute(actor, fileId, requestContext);
  }

  async findById(fileId: string) {
    return this.filesRepository.findById(fileId);
  }
}
