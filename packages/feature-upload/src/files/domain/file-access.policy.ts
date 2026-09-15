import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { ACTION, perm } from "@repo/api-runtime";

import { FILE_KIND, FILE_VISIBILITY } from "../../constants/file.constants";

/**
 * Organization-admin role name. `SUPER_ADMIN` is a platform role owned by the
 * kernel (`PLATFORM_ROLE_NAMES`, and re-exported by feature-access-control);
 * `ADMIN` is owned by feature-access-control, whose contract a `domain/` file
 * must not depend on (ADR 0001 rule 1), so the literal stays local to the rule
 * that needs it.
 */
const ORGANIZATION_ADMIN_ROLE = "ADMIN";

export interface FileAccessActor {
  userId: string;
  organizationId: string | null;
  roles: readonly string[];
  permissions: readonly string[];
}

export interface FileAccessSubject {
  organizationId: string | null;
  uploadedById: string | null;
  kind: string;
  visibility: string;
}

/**
 * Whether an actor may read/download/mutate a single file.
 *
 * Rules:
 *   1. Same org (SUPER_ADMIN may cross orgs).
 *   2. AUDIT_EXPORT / RESTRICTED require audit.read or SUPER_ADMIN.
 *   3. Otherwise: uploader, ADMIN, or SUPER_ADMIN.
 * Trace: file-access service / list ACL alignment.
 */
export function canAccessFile(input: { actor: FileAccessActor; file: FileAccessSubject }): boolean {
  const { actor, file } = input;
  const isSuperAdmin = actor.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN);
  const isAdmin = actor.roles.includes(ORGANIZATION_ADMIN_ROLE) || isSuperAdmin;

  if (file.organizationId !== actor.organizationId && !isSuperAdmin) {
    return false;
  }

  if (file.kind === FILE_KIND.AUDIT_EXPORT || file.visibility === FILE_VISIBILITY.RESTRICTED) {
    return isSuperAdmin || actor.permissions.includes(perm("audit", ACTION.READ));
  }

  return file.uploadedById === actor.userId || isAdmin;
}

/** List-query scope that mirrors `canAccessFile` for bulk listing. */
export function listFilesAccessScope(actor: FileAccessActor): {
  uploadedById?: string;
  excludeKinds?: string[];
  excludeVisibilities?: string[];
} {
  const isSuperAdmin = actor.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN);
  const isAdmin = actor.roles.includes(ORGANIZATION_ADMIN_ROLE) || isSuperAdmin;
  const hasAuditAccess = isSuperAdmin || actor.permissions.includes(perm("audit", ACTION.READ));

  return {
    ...(!isSuperAdmin ? { excludeKinds: [FILE_KIND.AUDIT_EXPORT] } : {}),
    ...(!hasAuditAccess ? { excludeVisibilities: [FILE_VISIBILITY.RESTRICTED] } : {}),
    ...(!isAdmin ? { uploadedById: actor.userId } : {}),
  };
}
