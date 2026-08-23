/**
 * Application-layer re-export of the domain-owned import type contract.
 * Consumers outside the module should use the module barrel instead.
 */
export {
  isSupportedImportType,
  SUPPORTED_IMPORT_TYPES,
  type SupportedImportType,
} from "../domain/import-types";
