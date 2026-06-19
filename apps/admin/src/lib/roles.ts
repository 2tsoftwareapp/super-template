import type { RoleDto } from "./api-types";

export const PRIVILEGED_ROLE_NAMES = ["SUPER_ADMIN", "ADMIN"] as const;

export function formatRoleName(name: string) {
  return name.toLowerCase().replace(/_/g, " ");
}

export function isPrivilegedRoleName(name: string) {
  return PRIVILEGED_ROLE_NAMES.includes(
    name as (typeof PRIVILEGED_ROLE_NAMES)[number],
  );
}

export function canAssignRole(actorRoles: string[], roleName: string) {
  if (roleName === "SUPER_ADMIN") {
    return false;
  }

  if (actorRoles.includes("SUPER_ADMIN")) {
    return roleName === "ADMIN" || roleName === "USER";
  }

  return roleName === "USER";
}

export function getAssignableRoles(
  actorRoles: string[],
  roles: RoleDto[],
): RoleDto[] {
  const assignable = roles.filter((role) =>
    canAssignRole(actorRoles, role.name),
  );
  const byName = new Map<string, RoleDto>();

  for (const role of assignable) {
    const existing = byName.get(role.name);
    if (!existing || role.scope === "platform") {
      byName.set(role.name, role);
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function buildRoleLookup(roles: RoleDto[]) {
  return new Map(roles.map((role) => [role.id, role] as const));
}
