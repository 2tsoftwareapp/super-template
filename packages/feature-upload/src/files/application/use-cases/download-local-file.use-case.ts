import type { PlatformTransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, PLATFORM_TRANSACTION_PORT } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { FILE_ERROR_CODES } from "@repo/feature-upload/contracts";

import { OBJECT_STORAGE, type ObjectStorage } from "../../../storage";
import { FILES_REPOSITORY, type FilesRepositoryPort } from "../ports/files.repository.port";
import { LocalFileDownloadUrlService } from "../services/local-file-download-url.service";

/**
 * Serves the signed local-storage download URL that
 * {@link LocalFileDownloadUrlService} hands to a browser.
 *
 * The URL is a capability: the HMAC token (file id + storage key + expiry) is
 * the authorization, exactly like an S3 pre-signed URL, so there is no session
 * to read. The row fetch therefore uses a platform transaction (RLS bypass) —
 * tenancy is proven by the token, not by a request user.
 */
@Injectable()
export class DownloadLocalFileUseCase {
  constructor(
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    @Inject(PLATFORM_TRANSACTION_PORT)
    private readonly platformTransactionPort: PlatformTransactionPort,
    private readonly localFileDownloadUrlService: LocalFileDownloadUrlService,
  ) {}

  async execute(fileId: string, token?: string) {
    if (!this.localFileDownloadUrlService.isEnabled()) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Local file downloads are disabled",
        HttpStatus.NOT_FOUND,
      );
    }

    const file = await this.platformTransactionPort.run((tx) =>
      this.filesRepository.findById(fileId, tx),
    );

    if (!file || file.deletedAt) {
      throw new AppError(FILE_ERROR_CODES.FILE_NOT_FOUND, "File not found", HttpStatus.NOT_FOUND);
    }

    this.localFileDownloadUrlService.assertValidToken(file.id, file.storageKey, token);

    const content = await this.objectStorage.read(file.storageKey);

    return { content, file };
  }
}
