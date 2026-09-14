import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";

/**
 * Role catalog for this feature. `SUPER_ADMIN` is owned by the shared kernel
 * (`PLATFORM_ROLE_NAMES`) so audit, audit-export and organization management
 * can apply the same platform role without depending on this feature; the
 * remaining fixed roles stay local to access-control.
 */
export const ROLE_NAMES = {
  SUPER_ADMIN: PLATFORM_ROLE_NAMES.SUPER_ADMIN,
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export const FIXED_ROLE_NAMES = Object.values(ROLE_NAMES);

export const PRIVILEGED_ROLE_NAMES = [ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.ADMIN] as const;

export type PrivilegedRoleName = (typeof PRIVILEGED_ROLE_NAMES)[number];

export function isPrivilegedRoleName(name: string): name is PrivilegedRoleName {
  return (PRIVILEGED_ROLE_NAMES as readonly string[]).includes(name);
}

export function isFixedRoleName(name: string): name is RoleName {
  return (FIXED_ROLE_NAMES as readonly string[]).includes(name);
}
