/**
 * Hard bound on how many data rows a single import file may contain. Rows
 * beyond this are rejected up front (job marked FAILED) so an upload cannot
 * trigger an unbounded synchronous parse + per-row import.
 */
export const MAX_IMPORT_ROWS = 5000;

/** Supported import adapter types — single source is application/import-constants.ts; domain re-exports for internal use. */
export { isSupportedImportType, SUPPORTED_IMPORT_TYPES } from "../application/import-constants";
export type { SupportedImportType } from "../application/import-constants";
