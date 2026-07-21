import type { PermissionDto } from "@/features/roles/model/roles.schemas";

/**
 * Role-management permission selector. Centralizes the `roles.*` permission
 * string checks so views receive booleans instead of repeating
 * `permissions.includes("roles.update")`.
 */
export interface RoleManagementPermissions {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isSuperAdmin: boolean;
}

export function selectRoleManagementPermissions(
  permissions: readonly string[] | undefined,
  roles: readonly string[] | undefined,
): RoleManagementPermissions {
  const granted = new Set(permissions ?? []);

  return {
    canCreate: granted.has("roles.create"),
    canUpdate: granted.has("roles.update"),
    canDelete: granted.has("roles.delete"),
    isSuperAdmin: (roles ?? []).includes("SUPER_ADMIN"),
  };
}

/**
 * Permissions an actor may assign when creating/editing an org-scoped role.
 * Super admins see the full organization-scoped catalog; others only what they hold.
 */
export function selectDelegatablePermissions(
  catalog: readonly PermissionDto[],
  actorPermissions: readonly string[],
  isSuperAdmin: boolean,
): PermissionDto[] {
  const held = new Set(actorPermissions);
  return catalog.filter(
    (permission) =>
      permission.scope === "organization" &&
      (isSuperAdmin || held.has(permission.name)),
  );
}
