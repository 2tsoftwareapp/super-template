import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";

import { OBJECT_STORAGE, type ObjectStorage } from "../../../storage";
import { FileAccessService } from "../services/file-access.service";
import { LocalFileDownloadUrlService } from "../services/local-file-download-url.service";

@Injectable()
export class GetFileSignedUrlUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly localFileDownloadUrlService: LocalFileDownloadUrlService,
  ) {}

  async execute(actor: AuthenticatedRequestUser, fileId: string) {
    const file = await this.fileAccessService.findAccessibleFile(actor, fileId);
    let url: string;

    if (this.localFileDownloadUrlService.isEnabled()) {
      url = this.localFileDownloadUrlService.createSignedUrl(file.id, file.storageKey);
    } else {
      url = await this.objectStorage.getSignedUrl(
        file.storageKey,
        this.localFileDownloadUrlService.expiresInSeconds,
      );
    }

    return {
      id: file.id,
      url,
      expiresInSeconds: this.localFileDownloadUrlService.expiresInSeconds,
    };
  }
}
