/** @deprecated Prefer `@repo/feature-upload/contracts` — kept for transitional imports. */
export const FILE_VISIBILITY = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  INTERNAL: "INTERNAL",
  RESTRICTED: "RESTRICTED",
} as const;

export type FileVisibility = (typeof FILE_VISIBILITY)[keyof typeof FILE_VISIBILITY];

export const FILE_KIND = {
  DEFAULT: "DEFAULT",
  AUDIT_EXPORT: "AUDIT_EXPORT",
} as const;

export type FileKind = (typeof FILE_KIND)[keyof typeof FILE_KIND];
