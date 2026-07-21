export interface ImportManagementPermissions {
  canCreate: boolean;
  canUpdate: boolean;
}

export function selectImportPermissions(
  permissions: readonly string[] | undefined,
): ImportManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canCreate: granted.has("imports.create"),
    canUpdate: granted.has("imports.update"),
  };
}
