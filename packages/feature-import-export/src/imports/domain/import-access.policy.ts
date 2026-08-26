import { ROLE_NAMES } from "@repo/api-runtime";

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
  const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);
  const isAdmin = actor.roles.includes(ROLE_NAMES.ADMIN) || isSuperAdmin;

  if (job.organizationId !== actor.organizationId && !isSuperAdmin) {
    return false;
  }

  return job.createdById === actor.userId || isAdmin;
}
