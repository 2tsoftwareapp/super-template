import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";

/**
 * Organization-admin role name. `SUPER_ADMIN` is a platform role owned by the
 * kernel (`PLATFORM_ROLE_NAMES`, and re-exported by feature-access-control);
 * `ADMIN` is owned by feature-access-control, whose contract a `domain/` file
 * must not depend on (ADR 0001 rule 1), so the literal stays local to the rule
 * that needs it.
 */
const ORGANIZATION_ADMIN_ROLE = "ADMIN";

export interface ImportAccessActor {
  userId: string;
  organizationId: string | null;
  roles: readonly string[];
}

export interface ImportAccessSubject {
  createdById: string;
  organizationId: string | null;
}

/**
 * Whether an actor may read/confirm an import job.
 *
 * Rules:
 *   1. Same org (SUPER_ADMIN may cross orgs).
 *   2. Creator, ADMIN, or SUPER_ADMIN.
 * Trace: get/confirm import use cases.
 */
export function canAccessImportJob(input: {
  actor: ImportAccessActor;
  job: ImportAccessSubject;
}): boolean {
  const { actor, job } = input;
  const isSuperAdmin = actor.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN);
  const isAdmin = actor.roles.includes(ORGANIZATION_ADMIN_ROLE) || isSuperAdmin;

  if (job.organizationId !== actor.organizationId && !isSuperAdmin) {
    return false;
  }

  return job.createdById === actor.userId || isAdmin;
}
