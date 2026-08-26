export { AttachmentsModule } from "../attachments/attachments.module";
export { FILES_REPOSITORY } from "../files/application/ports/files.repository.port";
export type { FilesRepositoryPort } from "../files/application/ports/files.repository.port";
export { FileAccessService } from "../files/application/services/file-access.service";
/** Public contracts for @repo/feature-upload. */
export { FilesModule } from "../files/files.module";
export { FilesRepository } from "../files/infrastructure/files.repository";
export { OBJECT_STORAGE } from "../storage/application/ports/object-storage.interface";
export type { ObjectStorage } from "../storage/application/ports/object-storage.interface";
export { StorageModule } from "../storage/storage.module";
