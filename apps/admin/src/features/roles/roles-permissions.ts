/**
 * Role-management permission selector. Centralizes the `roles.*` permission
 * string checks so views receive booleans instead of repeating
 * `permissions.includes("roles.update")`.
 */
export interface RoleManagementPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export function selectRoleManagementPermissions(
  permissions: readonly string[] | undefined,
): RoleManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canCreate: granted.has("roles.create"),
    canUpdate: granted.has("roles.update"),
    canDelete: granted.has("roles.delete"),
  };
}
