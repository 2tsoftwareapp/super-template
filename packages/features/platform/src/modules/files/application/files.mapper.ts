import type { FileRecord } from "./ports/files.repository.port";

export class FilesMapper {
  static toFileDto(file: FileRecord) {
    // Omit storageKey from the public DTO — clients use signed/download URLs.
    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      checksum: file.checksum,
      latestVersion: file.latestVersion,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
    };
  }
}
