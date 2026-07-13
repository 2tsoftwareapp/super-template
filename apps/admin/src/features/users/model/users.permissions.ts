/**
 * User-management permission selector. Centralizes the `users.*` permission
 * string checks so views and components receive booleans instead of repeating
 * `permissions.includes("users.update")` across the feature.
 */
export interface UserManagementPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function selectUserManagementPermissions(
  permissions: readonly string[] | undefined,
): UserManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canCreate: granted.has("users.create"),
    canUpdate: granted.has("users.update"),
    canDelete: granted.has("users.delete"),
  };
}
