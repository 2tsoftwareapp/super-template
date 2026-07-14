import type { SessionUser } from "@/lib/api-types";

import {
  canAccessResource,
  getFirstAccessibleResourcePath,
  getResourceForPath,
  hasAdminAppAccess,
} from "@/lib/admin-resources";

// The full client-gate state machine as a pure function so it can be
// unit-tested without rendering. useAdminGuard turns each non-ready decision
// into the matching navigation side effect.
export const ADMIN_PASSWORD_CHANGE_PATH = "/security/password";

export type AdminGuardDecision =
  | { status: "loading" }
  | { status: "redirect-login" }
  | { status: "sign-out" }
  | { status: "redirect-password-change" }
  | { status: "redirect-resource"; path: string }
  | {
      status: "ready";
      user: SessionUser;
      permissions: string[];
      organizationId: string | null;
    };

export function resolveAdminGuard(input: {
  isLoading: boolean;
  user: SessionUser | undefined;
  permissions: string[] | undefined;
  organizationId: string | null | undefined;
  pathname: string;
  mustChangePassword?: boolean | undefined;
}): AdminGuardDecision {
  if (input.isLoading) {
    return { status: "loading" };
  }

  const { user } = input;
  if (!user) {
    return { status: "redirect-login" };
  }

  const permissions = input.permissions ?? [];

  if (!hasAdminAppAccess({ roles: user.roles, permissions })) {
    return { status: "sign-out" };
  }

  if (input.mustChangePassword && input.pathname !== ADMIN_PASSWORD_CHANGE_PATH) {
    return { status: "redirect-password-change" };
  }

  const resource = getResourceForPath(input.pathname);
  if (!canAccessResource(resource, permissions)) {
    return {
      status: "redirect-resource",
      path: getFirstAccessibleResourcePath(permissions),
    };
  }

  return {
    status: "ready",
    user,
    permissions,
    organizationId: input.organizationId ?? null,
  };
}
