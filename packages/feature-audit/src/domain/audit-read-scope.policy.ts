import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { AppError } from "@repo/api-kernel";

/**
 * Platform super-role name (single source of truth for audit read scope).
 * Kept local instead of importing ROLE_NAMES from @repo/feature-access-control:
 * access-control depends on this feature's audit writer, so the import would
 * create a package cycle.
 */
export const PLATFORM_SUPER_ADMIN = "SUPER_ADMIN";

/** Platform-generic auth code; the aggregated catalog lives in api-runtime. */
const AUTH_FORBIDDEN = "AUTH_FORBIDDEN";

type AuditReadActor = Pick<AuthenticatedRequestUser, "roles" | "organizationId">;

/**
 * Resolved read scope for the audit trail:
 *   - `platform` — every row, including platform-scoped rows (`organizationId` null).
 *   - `organization` — only rows recorded for that organization.
 */
export type AuditReadScope =
  | { readonly kind: "platform" }
  | { readonly kind: "organization"; readonly organizationId: string };

export const isPlatformSuperAdmin = (actor: Pick<AuditReadActor, "roles">): boolean =>
  actor.roles.includes(PLATFORM_SUPER_ADMIN);

/**
 * Resolve the audit read scope for an actor. Shared by the list and get use
 * cases so both widen and narrow identically:
 *   1. SUPER_ADMIN reads every row (platform-scoped rows included).
 *   2. An actor with an organization reads only that organization's rows.
 *   3. An actor without an organization that is not SUPER_ADMIN is forbidden.
 */
export function resolveAuditReadScope(actor: AuditReadActor): AuditReadScope {
  if (isPlatformSuperAdmin(actor)) {
    return { kind: "platform" };
  }

  if (actor.organizationId) {
    return { kind: "organization", organizationId: actor.organizationId };
  }

  throw new AppError(AUTH_FORBIDDEN, "Organization ID is required for non-super admin", 403);
}

/** Whether a row is visible inside the resolved scope. */
export function canReadAuditRow(scope: AuditReadScope, rowOrganizationId: string | null): boolean {
  return scope.kind === "platform" || rowOrganizationId === scope.organizationId;
}
