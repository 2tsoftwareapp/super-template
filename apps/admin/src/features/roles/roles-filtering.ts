import type { ManagedRoleDto } from "@/features/roles/roles-schemas";

export type MergedRole = ManagedRoleDto & { scopes: string[] };

export function optionalText(value: string | null | undefined | object): string {
  return typeof value === "string" ? value : "";
}

/** Merge same-named roles (e.g. ADMIN platform + ADMIN org) into one node. */
export function mergeRoles(roles: ManagedRoleDto[]): MergedRole[] {
  const map = new Map<string, MergedRole>();

  for (const role of roles) {
    const existing = map.get(role.name);

    if (existing) {
      if (!existing.scopes.includes(role.scope)) {
        existing.scopes.push(role.scope);
      }
      if (role.permissions.length > existing.permissions.length) {
        existing.permissions = role.permissions;
      }
    } else {
      map.set(role.name, { ...role, scopes: [role.scope] });
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
