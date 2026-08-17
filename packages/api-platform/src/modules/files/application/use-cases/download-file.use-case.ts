import type { AuthenticatedRequestUser } from "@repo/api-core";

import { Inject, Injectable } from "@nestjs/common";

import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from "../../../storage/application/object-storage.interface";
import { FileAccessService } from "../services/file-access.service";
import { LocalFileDownloadUrlService } from "../services/local-file-download-url.service";

@Injectable()
export class DownloadFileUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly localFileDownloadUrlService: LocalFileDownloadUrlService,
  ) {}

  async execute(actor: AuthenticatedRequestUser, fileId: string, token?: string) {
    const file = await this.fileAccessService.findAccessibleFile(actor, fileId);

    if (this.localFileDownloadUrlService.isEnabled()) {
      this.localFileDownloadUrlService.assertValidToken(file.id, file.storageKey, token);
    }

    const content = await this.objectStorage.read(file.storageKey);

    return {
      content,
      file,
    };
  }
}
