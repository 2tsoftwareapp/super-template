/** Domain-owned error codes for @repo/feature-import-export. Stable API contract values. */
export const IMPORT_EXPORT_ERROR_CODES = {
  IMPORT_JOB_NOT_FOUND: "IMPORT_JOB_NOT_FOUND",
  EXPORT_JOB_NOT_FOUND: "EXPORT_JOB_NOT_FOUND",
  /**
   * The stored file no longer matches the fingerprint recorded when it was
   * validated, so confirming the import is refused.
   */
  IMPORT_FILE_MODIFIED: "IMPORT_FILE_MODIFIED",
} as const;
