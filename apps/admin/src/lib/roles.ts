import type { RoleDto } from "./types";

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
  if (actorRoles.includes("SUPER_ADMIN")) {
    return true;
  }

  return roleName === "USER";
}

export function getAssignableRoles(
  actorRoles: string[],
  roles: RoleDto[],
): RoleDto[] {
  return roles.filter((role) => canAssignRole(actorRoles, role.name));
}

export function buildRoleLookup(roles: RoleDto[]) {
  return new Map(roles.map((role) => [role.id, role] as const));
}
