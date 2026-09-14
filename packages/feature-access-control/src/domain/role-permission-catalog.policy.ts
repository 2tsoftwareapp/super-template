import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { AppError, PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

/**
 * Permission catalog row as needed by the delegation rules below. Structurally
 * compatible with the repository's `PermissionRecord`, but declared here so the
 * policy stays independent of the persistence port.
 */
export interface DelegableCatalogPermission {
  name: string;
  isSystem: boolean;
  scope: string | null;
}

type DelegatingActor = Pick<AuthenticatedRequestUser, "roles" | "permissions">;

/**
 * Authorization rule for granting catalog permissions to a custom role.
 *
 * Rules (first violation wins):
 *   1. Only system catalog permissions may be delegated.
 *   2. Organization-scoped roles cannot receive platform-scoped permissions.
 *   3. A non-SUPER_ADMIN actor can only delegate permissions it holds itself.
 *
 * Trace: create-custom-role / update-custom-role use cases via the shared
 * `CatalogPermissionResolver` application service.
 */
export function assertDelegableCatalogPermissions(input: {
  actor: DelegatingActor;
  targetOrganizationId: string | null;
  permissions: readonly DelegableCatalogPermission[];
}): void {
  const invalidPermission = input.permissions.find((permission) => !permission.isSystem);
  if (invalidPermission) {
    throw new AppError(
      ERROR_CODES.VALIDATION_FAILED,
      "Custom roles can only use system catalog permissions",
      400,
    );
  }

  if (input.targetOrganizationId !== null) {
    const platformPermission = input.permissions.find(
      (permission) => permission.scope === "platform",
    );
    if (platformPermission) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        `Permission "${platformPermission.name}" is platform-scoped and cannot be assigned to organization roles`,
        403,
      );
    }
  }

  if (input.actor.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN)) {
    return;
  }

  const actorPermissionSet = new Set(input.actor.permissions ?? []);
  const undelegablePermission = input.permissions.find(
    (permission) => !actorPermissionSet.has(permission.name),
  );
  if (undelegablePermission) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      `You do not have the "${undelegablePermission.name}" permission to delegate it`,
      403,
    );
  }
}
