import type { AuthenticatedRequestUser, JsonObject } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";

import { FILES_REPOSITORY, type FilesRepositoryPort } from "../ports/files.repository.port";
import { FileAccessService } from "../services/file-access.service";

export interface FileHistoryEvent {
  type: "version" | "audit";
  action: string;
  actorId: string | null;
  metadata: JsonObject | null;
  createdAt: string;
}

@Injectable()
export class GetFileHistoryUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, fileId: string): Promise<FileHistoryEvent[]> {
    const file = await this.fileAccessService.findAccessibleFile(actor, fileId);
    const versions = await this.filesRepository.listVersions(file.id);

    // Version timeline is owned by upload. Audit timeline remains available via audit APIs.
    return versions.map((version) => ({
      type: "version" as const,
      action: version.versionNumber === 1 ? "file.uploaded" : "file.version_uploaded",
      actorId: version.createdById,
      metadata: {
        versionNumber: version.versionNumber,
        sizeBytes: version.sizeBytes,
        checksum: version.checksum,
      },
      createdAt: version.createdAt.toISOString(),
    }));
  }
}
