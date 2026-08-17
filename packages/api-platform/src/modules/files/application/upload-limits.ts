/**
 * Application-facing re-export of upload limits so presentation interceptors
 * do not import the domain package directly.
 */
export {
  getUploadExtension,
  isAllowedUploadExtension,
  MAX_FILE_SIZE_BYTES,
} from "../domain/upload-policy";
