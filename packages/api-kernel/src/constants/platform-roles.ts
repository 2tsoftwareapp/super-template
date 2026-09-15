/**
 * Platform role names owned by the shared kernel.
 *
 * Feature `domain/` layers must not depend on another feature at runtime, so
 * the platform-wide role identifiers live here instead of inside
 * `feature-access-control`: audit, audit-export and organization management all
 * need `SUPER_ADMIN` for their own authorization rules, and access-control's
 * `ROLE_NAMES` catalog re-exports it to keep one value for the whole monorepo.
 */
export const PLATFORM_ROLE_NAMES = {
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type PlatformRoleName = (typeof PLATFORM_ROLE_NAMES)[keyof typeof PLATFORM_ROLE_NAMES];
