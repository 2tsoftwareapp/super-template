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

export function isOrganizationRole(role: string) {
  return role !== "USER" && role !== "SUPER_ADMIN";
}

export function canAssignRole(actorRoles: string[], roleName: string) {
  if (roleName === "SUPER_ADMIN") {
    return false;
  }

  if (actorRoles.includes("SUPER_ADMIN")) {
    return true;
  }

  if (roleName === "USER") {
    return true;
  }

  if (roleName === "ADMIN") {
    return false;
  }

  if (isOrganizationRole(roleName)) {
    return actorRoles.includes("ADMIN");
  }

  return false;
}

export function getAssignableRoles(
  actorRoles: string[],
  roles: RoleDto[],
): RoleDto[] {
  return roles
    .filter((role) => canAssignRole(actorRoles, role.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildRoleLookup(roles: RoleDto[]) {
  return new Map(roles.map((role) => [role.id, role] as const));
}
