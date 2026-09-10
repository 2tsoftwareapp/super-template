export {
  ATTACHMENTS_REPOSITORY,
  type AttachmentsRepositoryPort,
} from "../../attachments/application/ports/attachments.repository.port";
export { FILES_REPOSITORY } from "../../files/application/ports/files.repository.port";
export type * from "../../files/application/ports/files.repository.port";
export {
  OBJECT_STORAGE,
  type ObjectStorage,
  type UploadInput,
  type UploadResult,
} from "../../storage/application/ports/object-storage.interface";
export {
  STORAGE_TRACKING_PORT,
  type StorageTrackingPort,
} from "../../storage/application/ports/storage-tracking.port";
