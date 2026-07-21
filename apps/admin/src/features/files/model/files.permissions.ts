/**
 * File-management permission selector. Views receive booleans instead of
 * repeating `permissions.includes("files.*")`.
 */
export interface FileManagementPermissions {
  canCreate: boolean;
  canDelete: boolean;
}

export function selectFilePermissions(
  permissions: readonly string[] | undefined,
): FileManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canCreate: granted.has("files.create"),
    canDelete: granted.has("files.delete"),
  };
}
