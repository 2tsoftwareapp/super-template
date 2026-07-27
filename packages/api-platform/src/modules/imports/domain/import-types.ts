/** Supported import adapter types exposed via the admin API. */
export const SUPPORTED_IMPORT_TYPES = ['users'] as const;

export type SupportedImportType = (typeof SUPPORTED_IMPORT_TYPES)[number];

export function isSupportedImportType(
  value: string,
): value is SupportedImportType {
  return (SUPPORTED_IMPORT_TYPES as readonly string[]).includes(value);
}
