/**
 * Hard bound on how many data rows a single import file may contain. Rows
 * beyond this are rejected up front (job marked FAILED) so an upload cannot
 * trigger an unbounded synchronous parse + per-row import.
 */
export const MAX_IMPORT_ROWS = 5000;

/** Supported import adapter types exposed via the admin API. */
export const SUPPORTED_IMPORT_TYPES = ['users'] as const;

export type SupportedImportType = (typeof SUPPORTED_IMPORT_TYPES)[number];

export function isSupportedImportType(
  value: string,
): value is SupportedImportType {
  return (SUPPORTED_IMPORT_TYPES as readonly string[]).includes(value);
}
