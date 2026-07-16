import type { ManagedRoleDto } from "@/features/roles/model/roles.schemas";

export type MergedRole = ManagedRoleDto & { scopes: string[] };

export function optionalText(value: string | null | undefined | object): string {
  return typeof value === "string" ? value : "";
}

/**
 * Merge system roles with the same name (e.g. platform ADMIN + org ADMIN)
 * into a single node showing multiple scopes. System roles are seeded with
 * identical permission sets across scopes, so we keep the first encounter.
 */
export function mergeSystemRoles(roles: ManagedRoleDto[]): MergedRole[] {
  const map = new Map<string, MergedRole>();

  for (const role of roles) {
    const existing = map.get(role.name);

    if (existing) {
      if (!existing.scopes.includes(role.scope)) {
        existing.scopes.push(role.scope);
      }
    } else {
      map.set(role.name, { ...role, scopes: [role.scope] });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Custom roles must NOT be merged by name — each one is a unique record
 * with its own organization, ID, and permission set. Key by role.id.
 */
export function mergeCustomRoles(roles: ManagedRoleDto[]): MergedRole[] {
  const map = new Map<string, MergedRole>();

  for (const role of roles) {
    const existing = map.get(role.id);

    if (existing) {
      if (!existing.scopes.includes(role.scope)) {
        existing.scopes.push(role.scope);
      }
    } else {
      map.set(role.id, { ...role, scopes: [role.scope] });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Case-insensitive search across role name, description and permission names. */
export function filterRolesBySearch(
  roles: MergedRole[],
  search: string,
): MergedRole[] {
  if (!search) {
    return roles;
  }

  const query = search.toLowerCase();

  return roles.filter(
    (role) =>
      role.name.toLowerCase().includes(query) ||
      optionalText(role.description).toLowerCase().includes(query) ||
      role.permissions.some((permission) =>
        permission.name.toLowerCase().includes(query),
      ),
  );
}
