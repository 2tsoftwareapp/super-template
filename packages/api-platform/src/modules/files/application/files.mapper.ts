import type { FilesRepository } from '../infrastructure/files.repository';

type FileRecord = NonNullable<
  Awaited<ReturnType<FilesRepository['findById']>>
>;

export class FilesMapper {
  static toFileDto(file: FileRecord) {
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
