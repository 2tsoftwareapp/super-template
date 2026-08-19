import type { RoleDto } from "./api-types";

export const PRIVILEGED_ROLE_NAMES = ["SUPER_ADMIN", "ADMIN"] as const;

export function formatRoleName(name: string) {
  return name.toLowerCase().replace(/_/g, " ");
}

export function isPrivilegedRoleName(name: string) {
  return PRIVILEGED_ROLE_NAMES.includes(name as (typeof PRIVILEGED_ROLE_NAMES)[number]);
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

export function getAssignableRoles(actorRoles: string[], roles: RoleDto[]): RoleDto[] {
  return roles
    .filter((role) => {
      if (!canAssignRole(actorRoles, role.name)) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface RoleWithOrg {
  id: string;
  name: string;
  organizationId: Record<string, never> | string | null;
}

export function filterRolesForOrganization<T extends RoleWithOrg>(
  roles: T[],
  organizationId: string | null | undefined,
): T[] {
  if (!organizationId) {
    // No org selected — only show platform roles (deduped)
    const seen = new Set<string>();
    return roles.filter((role) => {
      if (role.organizationId != null) return false;
      if (seen.has(role.name)) return false;
      seen.add(role.name);
      return true;
    });
  }

  const seen = new Set<string>();
  return roles.filter((role) => {
    // Platform roles: always visible
    if (role.organizationId == null) {
      if (seen.has(role.name)) return false;
      seen.add(role.name);
      return true;
    }
    // Org-scoped roles: filter by organization
    if (typeof role.organizationId !== "string") return false;
    if (role.organizationId !== organizationId) return false;
    if (seen.has(role.name)) return false;
    seen.add(role.name);
    return true;
  });
}

export function findPlatformUserRoleId<T extends RoleWithOrg>(roles: T[]) {
  return (
    roles.find((role) => role.name === "USER" && role.organizationId == null)?.id ??
    roles[0]?.id ??
    ""
  );
}

export function buildRoleLookup(roles: RoleDto[]) {
  return new Map(roles.map((role) => [role.id, role] as const));
}
